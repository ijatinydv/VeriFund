"""
main.py

This script creates a production-ready FastAPI service for the VeriFund project.
It loads two pre-trained XGBoost models (success scoring and pricing) and serves
predictions through REST API endpoints with data validation, transformation,
prediction, and explainability features.
"""

# ============================================================================
# STEP 1: Import Required Libraries
# ============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
import shap
import uvicorn
import xgboost as xgb
from typing import List, Dict
import httpx
import asyncio

# ============================================================================
# STEP 2: Define Pydantic Input Schema for Data Validation
# ============================================================================

class CreatorData(BaseModel):
    """
    Pydantic model for validating incoming creator data requests.
    Ensures all required fields are present and have correct data types.
    """
    projects_completed: int = Field(..., ge=5, le=50, description="Number of projects completed (5-50)")
    tenure_months: int = Field(..., ge=6, le=60, description="Tenure in months (6-60)")
    portfolio_strength: float = Field(..., ge=0.5, le=1.0, description="Portfolio strength score (0.5-1.0)")
    on_time_delivery_percent: float = Field(..., ge=0.7, le=1.0, description="On-time delivery rate (0.7-1.0)")
    avg_client_rating: float = Field(..., ge=3.5, le=5.0, description="Average client rating (3.5-5.0)")
    rating_trajectory: float = Field(..., ge=-0.2, le=0.3, description="Rating trajectory (-0.2-0.3)")
    dispute_rate: float = Field(..., ge=0.0, le=0.15, description="Dispute rate (0.0-0.15)")
    project_category: str = Field(..., description="Project category (e.g., 'UI/UX Design')")

    class Config:
        json_schema_extra = {
            "example": {
                "projects_completed": 25,
                "tenure_months": 36,
                "portfolio_strength": 0.85,
                "on_time_delivery_percent": 0.95,
                "avg_client_rating": 4.7,
                "rating_trajectory": 0.15,
                "dispute_rate": 0.03,
                "project_category": "Web Development"
            }
        }


class GitHubWebhookPayload(BaseModel):
    """
    Pydantic model for validating incoming GitHub webhook payload.
    Only includes fields we need for score calculation.
    """
    ref: str = Field(..., description="Git reference (e.g., 'refs/heads/main')")
    head_commit: Dict | None = Field(None, description="The most recent commit")
    repository: Dict = Field(..., description="Repository information")

    class Config:
        json_schema_extra = {
            "example": {
                "ref": "refs/heads/main",
                "head_commit": {
                    "message": "feat: add new feature",
                    "author": {"name": "Developer"},
                    "timestamp": "2025-10-13T10:00:00Z"
                },
                "repository": {
                    "name": "project-repo",
                    "full_name": "username/project-repo"
                }
            }
        }

# ============================================================================
# STEP 3: Load Models and Define Training Columns on Startup
# ============================================================================

print("="*80)
print("VeriFund API - Initializing...")
print("="*80)

# Load the pre-trained XGBoost success score model
try:
    model: xgb.XGBRegressor = joblib.load('verifund_model.joblib')
    print("✓ Success score model loaded successfully from 'verifund_model.joblib'")
except Exception as e:
    print(f"✗ Error loading success score model: {e}")
    raise

# Load the pre-trained XGBoost pricing model
try:
    price_model: xgb.XGBRegressor = joblib.load('price_model.joblib')
    print("✓ Pricing model loaded successfully from 'price_model.joblib'")
except Exception as e:
    print(f"✗ Error loading pricing model: {e}")
    raise

# Define the exact column names the model was trained on (after one-hot encoding)
# This is CRITICAL for ensuring prediction consistency
TRAINING_COLUMNS: List[str] = [
    'projects_completed',
    'tenure_months',
    'portfolio_strength',
    'on_time_delivery_percent',
    'avg_client_rating',
    'rating_trajectory',
    'dispute_rate',
    'project_category_Graphic Design',
    'project_category_Mobile Development',
    'project_category_UI/UX Design',
    'project_category_Web Development'
]

print(f"✓ Training columns defined: {len(TRAINING_COLUMNS)} features")

# Initialize SHAP explainer once at startup for efficiency
try:
    explainer: shap.TreeExplainer = shap.TreeExplainer(model)
    print("✓ SHAP TreeExplainer initialized for success score model")
except Exception as e:
    print(f"✗ Error initializing SHAP explainer: {e}")
    raise

print("="*80)
print("✓ API initialization complete")
print("="*80 + "\n")

# ============================================================================
# STEP 4: Initialize FastAPI Application
# ============================================================================

app: FastAPI = FastAPI(
    title="VeriFund Creator Scoring & Pricing API",
    description="API for predicting creator project success scores and suggesting project prices with explainable AI",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================================================
# STEP 5: Create Root Endpoint for Health Check
# ============================================================================

@app.get("/")
def read_root() -> Dict[str, str | Dict[str, str]]:
    """
    Health check endpoint to verify the API is running.
    """
    return {
        "service": "VeriFund Creator Scoring & Pricing API",
        "status": "active",
        "version": "2.0.0",
        "endpoints": {
            "score": "/score (POST) - Get creator success score",
            "suggest_price": "/suggest-price (POST) - Get pricing recommendation",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

# ============================================================================
# STEP 6: Create the /score POST Endpoint
# ============================================================================

@app.post("/score")
def score_creator(creator: CreatorData) -> dict:
    """
    Score a creator based on their performance metrics and provide explanations.
    
    Args:
        creator (CreatorData): Creator's performance data
        
    Returns:
        dict: JSON response containing the project success score and top reasons
    """
    try:
        # ----------------------------------------------------------------
        # Step 6a: Convert Pydantic object to DataFrame
        # ----------------------------------------------------------------
        input_dict: Dict = creator.dict()
        df: pd.DataFrame = pd.DataFrame([input_dict])
        
        print(f"\n[Request] Scoring creator with category: {creator.project_category}")
        
        # ----------------------------------------------------------------
        # Step 6b: Apply one-hot encoding (same as training)
        # ----------------------------------------------------------------
        # One-hot encode the project_category column
        df = pd.get_dummies(df, columns=['project_category'], drop_first=False)
        
        # ----------------------------------------------------------------
        # Step 6c: Reindex to match training columns exactly
        # ----------------------------------------------------------------
        # This ensures the DataFrame has the exact same columns in the exact
        # same order as the training data, filling missing categories with 0
        df = df.reindex(columns=TRAINING_COLUMNS, fill_value=0)
        
        print(f"[Processing] Data transformed to {df.shape[1]} features")
        
        # ----------------------------------------------------------------
        # Step 6d: Make prediction using the loaded model
        # ----------------------------------------------------------------
        prediction: np.ndarray = model.predict(df)
        project_success_score: float = float(prediction[0])  # Extract single score
        
        print(f"[Prediction] Score: {project_success_score:.2f}")
        
        # ----------------------------------------------------------------
        # Step 6e: Calculate SHAP explanations
        # ----------------------------------------------------------------
        # Calculate SHAP values for this single prediction
        shap_values: np.ndarray = explainer.shap_values(df)
        
        # If shap_values is 2D (single row), extract the first row
        if len(shap_values.shape) == 2:
            shap_values = shap_values[0]
        
        # ----------------------------------------------------------------
        # Step 6f: Format SHAP output into user-friendly reasons
        # ----------------------------------------------------------------
        # Create a list of features with their values and SHAP impacts
        feature_impacts: List[Dict] = []
        
        for idx, col in enumerate(TRAINING_COLUMNS):
            feature_value: float = df[col].values[0]
            shap_impact: float = float(shap_values[idx])
            
            # Only include features with non-zero values or significant impact
            if feature_value != 0 or abs(shap_impact) > 0.01:
                # Format feature name for better readability
                if col.startswith('project_category_'):
                    if feature_value == 1:  # Only show the active category
                        feature_name: str = col.replace('project_category_', '')
                        feature_impacts.append({
                            "feature": "project_category",
                            "value": feature_name,
                            "impact": round(shap_impact, 2)
                        })
                else:
                    feature_impacts.append({
                        "feature": col,
                        "value": round(feature_value, 2),
                        "impact": round(shap_impact, 2)
                    })
        
        # Sort by absolute impact (most impactful features first)
        feature_impacts.sort(key=lambda x: abs(x["impact"]), reverse=True)
        
        # Get top 5 most impactful reasons
        top_reasons: List[Dict] = feature_impacts[:5]
        
        print(f"[Explainability] Generated {len(top_reasons)} explanations")
        
        # ----------------------------------------------------------------
        # Step 6g: Return formatted JSON response
        # ----------------------------------------------------------------
        response: dict = {
            "projectSuccessScore": round(project_success_score, 2),
            "reasons": top_reasons
        }
        
        return response
        
    except Exception as e:
        print(f"[Error] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

# ============================================================================
# STEP 7: Create the /suggest-price POST Endpoint (Pricing Co-Pilot)
# ============================================================================

@app.post("/suggest-price")
def suggest_price(creator: CreatorData) -> dict:
    """
    Suggest a project price for a creator based on their performance metrics.
    
    Args:
        creator (CreatorData): Creator's performance data
        
    Returns:
        dict: JSON response containing suggested price and price range in INR
    """
    try:
        # ----------------------------------------------------------------
        # Step 7a: Convert Pydantic object to DataFrame
        # ----------------------------------------------------------------
        input_dict: Dict = creator.dict()
        df: pd.DataFrame = pd.DataFrame([input_dict])
        
        print(f"\n[Request] Pricing suggestion for creator with category: {creator.project_category}")
        
        # ----------------------------------------------------------------
        # Step 7b: Apply one-hot encoding (same as training)
        # ----------------------------------------------------------------
        # One-hot encode the project_category column
        df = pd.get_dummies(df, columns=['project_category'], drop_first=False)
        
        # ----------------------------------------------------------------
        # Step 7c: Reindex to match training columns exactly
        # ----------------------------------------------------------------
        # This ensures the DataFrame has the exact same columns in the exact
        # same order as the training data, filling missing categories with 0
        df = df.reindex(columns=TRAINING_COLUMNS, fill_value=0)
        
        print(f"[Processing] Data transformed to {df.shape[1]} features for pricing")
        
        # ----------------------------------------------------------------
        # Step 7d: Make price prediction using the pricing model
        # ----------------------------------------------------------------
        price_prediction: np.ndarray = price_model.predict(df)
        suggested_price: int = int(round(price_prediction[0]))  # Extract and round to integer
        
        print(f"[Prediction] Suggested Price: ₹{suggested_price:,}")
        
        # ----------------------------------------------------------------
        # Step 7e: Calculate price range (±12% for realistic variance)
        # ----------------------------------------------------------------
        price_variance_percent: float = 0.12  # 12% variance
        lower_bound: int = int(round(suggested_price * (1 - price_variance_percent)))
        upper_bound: int = int(round(suggested_price * (1 + price_variance_percent)))
        
        # Ensure range stays within realistic bounds (50k to 500k)
        lower_bound = max(50000, lower_bound)
        upper_bound = min(500000, upper_bound)
        
        print(f"[Price Range] ₹{lower_bound:,} - ₹{upper_bound:,}")
        
        # ----------------------------------------------------------------
        # Step 7f: Return formatted JSON response
        # ----------------------------------------------------------------
        response: dict = {
            "suggested_price": suggested_price,
            "price_range": [lower_bound, upper_bound]
        }
        
        return response
        
    except Exception as e:
        print(f"[Error] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing pricing request: {str(e)}"
        )

# ============================================================================
# STEP 8: Create the /webhook/github/{project_id} POST Endpoint
# ============================================================================

@app.post("/webhook/github/{project_id}")
async def handle_github_webhook(project_id: str, payload: GitHubWebhookPayload) -> dict:
    """
    Receives a webhook from GitHub upon a git push, analyzes the commit,
    simulates a score increase based on commit type, and notifies the backend.
    
    This endpoint processes GitHub webhook events and determines if the commit
    should trigger a potential score increase for the creator.
    
    Args:
        project_id (str): The unique identifier of the project
        payload (GitHubWebhookPayload): GitHub webhook payload
        
    Returns:
        dict: JSON response containing projectId, scoreIncrease, and message
    """
    try:
        print(f"\n{'='*80}")
        print(f"[Webhook] Received GitHub webhook for project: {project_id}")
        print(f"{'='*80}")
        
        # Extract commit message from the payload
        commit_message: str = ""
        commit_message_raw: str = ""
        if payload.head_commit:
            commit_message_raw = payload.head_commit.get('message', '')
            commit_message = commit_message_raw.lower()
            print(f"[Webhook] Commit message: '{commit_message_raw}'")
            print(f"[Webhook] Branch: {payload.ref}")
        else:
            print(f"[Webhook] No commit information in payload")
        
        # Define keywords that indicate meaningful code contributions
        meaningful_keywords: List[str] = [
            'feat', 'feature',      # New features
            'fix', 'bugfix',        # Bug fixes
            'chore',                # Maintenance tasks
            'docs', 'documentation',# Documentation
            'refactor',             # Code refactoring
            'perf', 'performance',  # Performance improvements
            'test',                 # Adding tests
            'style'                 # Code style improvements
        ]
        
        score_increase: float = 0.0
        matched_keyword: str = ""
        
        # Check if commit message contains any meaningful keywords
        for keyword in meaningful_keywords:
            if keyword in commit_message:
                matched_keyword = keyword
                # Generate a realistic score increase between 0.5 and 2.5 points
                score_increase = round(np.random.uniform(0.5, 2.5), 2)
                break
        
        if score_increase > 0:
            print(f"[Webhook] ✓ Meaningful commit detected (keyword: '{matched_keyword}')")
            print(f"[Webhook] ✓ Score increase calculated: +{score_increase} points")
            
            # Call backend to update the score in database
            backend_url = "http://localhost:5000/api/integrations/update-score"
            
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        backend_url,
                        json={
                            "projectId": project_id,
                            "scoreIncrease": score_increase,
                            "commitMessage": commit_message_raw
                        }
                    )
                    
                    if response.status_code == 200:
                        print(f"[Webhook] ✓ Backend notified successfully")
                        backend_data = response.json()
                        print(f"[Webhook] ✓ Score updated in database: {backend_data}")
                    else:
                        print(f"[Webhook] ✗ Backend returned error: {response.status_code}")
                        print(f"[Webhook] ✗ Response: {response.text}")
                        
            except Exception as backend_error:
                print(f"[Webhook] ✗ Failed to notify backend: {str(backend_error)}")
                # Continue anyway - webhook processing succeeded even if backend update failed
                
        else:
            print(f"[Webhook] ✗ No meaningful keywords found in commit message")
            print(f"[Webhook] ✗ No score increase triggered")
        
        print(f"{'='*80}\n")
        
        # Return response
        return {
            "projectId": project_id,
            "scoreIncrease": score_increase,
            "commitMessage": commit_message_raw,
            "message": "Webhook processed successfully"
        }
        
    except Exception as e:
        print(f"[Webhook Error] {str(e)}")
        print(f"{'='*80}\n")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing webhook: {str(e)}"
        )

# ============================================================================
# STEP 9: Add Uvicorn Runner for Local Development
# ============================================================================

if __name__ == "__main__":
    """
    Run the FastAPI application using Uvicorn ASGI server.
    Access the API at: http://127.0.0.1:8000
    Interactive docs at: http://127.0.0.1:8000/docs
    """
    print("\n" + "="*80)
    print("Starting VeriFund API Server...")
    print("="*80)
    print("API will be available at: http://127.0.0.1:8000")
    print("Interactive docs at: http://127.0.0.1:8000/docs")
    print("="*80 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
