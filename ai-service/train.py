"""
train.py

This script trains high-performance XGBoost regression models for the VeriFund project.
It loads synthetic creator data, prepares features, trains two models (success scoring
and pricing), evaluates their performance, and saves the trained models for API deployment.
"""

# ============================================================================
# STEP 1: Import Required Libraries
# ============================================================================

import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

print("="*80)
print("VeriFund Model Training Pipeline")
print("="*80)

# ============================================================================
# STEP 2: Load the Dataset
# ============================================================================

print("\n[1/8] Loading dataset from creator_data.csv...")

# Load the synthetic creator data
df = pd.read_csv('creator_data.csv')

print(f"✓ Dataset loaded successfully")
print(f"  - Total rows: {len(df)}")
print(f"  - Total columns: {len(df.columns)}")
print(f"  - Columns: {list(df.columns)}")

# ============================================================================
# STEP 3: Prepare Data for Training (Success Score Model)
# ============================================================================

print("\n[2/8] Preparing data for success score model...")

# Define target variable for success score (what we want to predict)
y = df['project_success_score']

# Define features (all columns except the targets)
X = df.drop(['project_success_score', 'project_price_inr'], axis=1)

# One-hot encode the categorical feature 'project_category'
# This converts categorical values into binary columns (dummy variables)
X = pd.get_dummies(X, columns=['project_category'], drop_first=False)

print(f"✓ Data preparation complete")
print(f"  - Target variable (y): project_success_score")
print(f"  - Number of features (X): {X.shape[1]}")
print(f"  - Feature columns after encoding: {list(X.columns)}")

# ============================================================================
# STEP 4: Split Data into Training and Testing Sets
# ============================================================================

print("\n[3/8] Splitting data into train and test sets...")

# Split the dataset: 80% training, 20% testing
# random_state=42 ensures reproducibility (same split every time)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, 
    test_size=0.20,      # 20% of data for testing
    random_state=42      # For reproducibility
)

print(f"✓ Data split complete")
print(f"  - Training set size: {len(X_train)} rows ({len(X_train)/len(X)*100:.1f}%)")
print(f"  - Test set size: {len(X_test)} rows ({len(X_test)/len(X)*100:.1f}%)")

# ============================================================================
# STEP 5: Initialize and Train the Success Score Model
# ============================================================================

print("\n[4/8] Initializing and training XGBoost success score model...")

# Initialize XGBoost Regressor with optimal hyperparameters
model = xgb.XGBRegressor(
    n_estimators=100,       # Number of boosting rounds (trees)
    learning_rate=0.1,      # Step size shrinkage to prevent overfitting
    random_state=42,        # For reproducibility
    max_depth=6,            # Maximum tree depth
    min_child_weight=1,     # Minimum sum of weights in a child node
    subsample=0.8,          # Fraction of samples used for training each tree
    colsample_bytree=0.8,   # Fraction of features used for training each tree
    objective='reg:squarederror',  # Loss function for regression
    verbosity=0             # Silent mode (no training logs)
)

# Train the model on the training data
print("  - Training in progress...")
model.fit(X_train, y_train)

print(f"✓ Model training complete")
print(f"  - Model type: XGBoost Regressor")
print(f"  - Number of trees: {model.n_estimators}")
print(f"  - Learning rate: {model.learning_rate}")

# ============================================================================
# STEP 6: Evaluate Success Score Model Performance
# ============================================================================

print("\n[5/8] Evaluating success score model performance on test set...")

# Make predictions on the test set
y_pred = model.predict(X_test)

# Calculate evaluation metrics
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

# Display evaluation results
print("\n" + "="*80)
print("SUCCESS SCORE MODEL PERFORMANCE ON TEST SET")
print("="*80)
print(f"Mean Absolute Error (MAE): {mae:.4f}")
print(f"  → On average, predictions are off by ±{mae:.2f} points")
print(f"\nR-squared (R²): {r2:.4f}")
print(f"  → Model explains {r2*100:.2f}% of variance in project success scores")
print("="*80)

# Interpret the results
if r2 > 0.85:
    print("\n✓ Excellent model performance! Ready for production deployment.")
elif r2 > 0.70:
    print("\n✓ Good model performance. Consider hyperparameter tuning for improvement.")
else:
    print("\n⚠ Model performance could be improved. Consider feature engineering or tuning.")

# ============================================================================
# STEP 7: Save the Success Score Model
# ============================================================================

print("\n[6/8] Saving trained success score model...")

# Save the model using joblib (optimized for large numpy arrays)
model_filename = 'verifund_model.joblib'
joblib.dump(model, model_filename)

print(f"✓ Model saved successfully as '{model_filename}'")
print(f"  - File can be loaded using: joblib.load('{model_filename}')")

# ============================================================================
# STEP 8: Train and Save Pricing Model
# ============================================================================

print("\n[7/8] Training Pricing Co-Pilot model...")

# Prepare data for pricing model
y_price = df['project_price_inr']

# Reuse the same features X (already one-hot encoded)
# Split data for pricing model with same random_state for consistency
X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(
    X, y_price,
    test_size=0.20,
    random_state=42
)

print(f"✓ Pricing data split complete")
print(f"  - Training set size: {len(X_train_p)} rows")
print(f"  - Test set size: {len(X_test_p)} rows")

# Initialize pricing model with same architecture
price_model = xgb.XGBRegressor(
    n_estimators=100,
    learning_rate=0.1,
    random_state=42,
    max_depth=6,
    min_child_weight=1,
    subsample=0.8,
    colsample_bytree=0.8,
    objective='reg:squarederror',
    verbosity=0
)

# Train the pricing model
print("  - Training pricing model in progress...")
price_model.fit(X_train_p, y_train_p)

# Evaluate pricing model
y_pred_price = price_model.predict(X_test_p)
mae_price = mean_absolute_error(y_test_p, y_pred_price)
r2_price = r2_score(y_test_p, y_pred_price)

print("\n" + "="*80)
print("PRICING MODEL PERFORMANCE ON TEST SET")
print("="*80)
print(f"Mean Absolute Error (MAE): ₹{mae_price:.2f}")
print(f"  → On average, price predictions are off by ±₹{mae_price:,.0f}")
print(f"\nR-squared (R²): {r2_price:.4f}")
print(f"  → Model explains {r2_price*100:.2f}% of variance in project prices")
print("="*80)

if r2_price > 0.85:
    print("\n✓ Excellent pricing model performance!")
elif r2_price > 0.70:
    print("\n✓ Good pricing model performance.")
else:
    print("\n⚠ Pricing model performance could be improved.")

# Save the pricing model
print("\n[8/8] Saving trained pricing model...")
price_model_filename = 'price_model.joblib'
joblib.dump(price_model, price_model_filename)

print(f"✓ Pricing model saved successfully as '{price_model_filename}'")
print(f"  - File can be loaded using: joblib.load('{price_model_filename}')")

# ============================================================================
# Training Pipeline Complete
# ============================================================================

print("\n" + "="*80)
print("✓ TRAINING PIPELINE COMPLETE")
print("="*80)
print(f"Both models are ready for deployment in the VeriFund API.")
print(f"Success Score Model: {model_filename}")
print(f"Pricing Model: {price_model_filename}")
print("="*80 + "\n")
