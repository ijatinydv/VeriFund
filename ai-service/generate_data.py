"""
generate_data.py

This script generates synthetic creator data for the VeriFund project.
It creates 10,000 rows of realistic creator performance data with logical
correlations between features, a calculated project success score, and a project price.
"""

import pandas as pd
import numpy as np
from faker import Faker

# Initialize random seed for reproducibility
np.random.seed(42)
fake = Faker()
Faker.seed(42)

# Define the number of rows to generate
NUM_ROWS = 10000

print(f"Generating {NUM_ROWS} rows of synthetic creator data...")

# ============================================================================
# STEP 1: Generate base features with realistic distributions
# ============================================================================

# Generate tenure_months (6-60 months)
tenure_months = np.random.randint(6, 61, NUM_ROWS)

# Generate projects_completed - positively correlated with tenure
# Base projects on tenure, with some randomness
base_projects = (tenure_months / 60) * 45 + 5  # Scale with tenure
projects_completed = np.clip(
    base_projects + np.random.normal(0, 5, NUM_ROWS),  # Add noise
    5, 50
).astype(int)

# Generate portfolio_strength (0.5-1.0)
portfolio_strength = np.random.uniform(0.5, 1.0, NUM_ROWS)

# ============================================================================
# STEP 2: Generate correlated features
# ============================================================================

# Generate on_time_delivery_percent (0.7-1.0)
# Slightly influenced by portfolio strength
base_delivery = np.random.uniform(0.7, 1.0, NUM_ROWS)
on_time_delivery_percent = np.clip(
    base_delivery + (portfolio_strength - 0.75) * 0.1,
    0.7, 1.0
)

# Generate avg_client_rating (3.5-5.0) - positively correlated with on_time_delivery
# Strong correlation: better delivery = higher ratings
base_rating = 3.5 + (on_time_delivery_percent - 0.7) / 0.3 * 1.3  # Scale delivery to rating range
avg_client_rating = np.clip(
    base_rating + np.random.normal(0, 0.15, NUM_ROWS),  # Add small noise
    3.5, 5.0
)

# Generate dispute_rate (0.0-0.15) - negatively correlated with avg_client_rating
# Higher ratings = lower disputes
base_dispute = 0.15 - ((avg_client_rating - 3.5) / 1.5) * 0.12  # Inverse relationship
dispute_rate = np.clip(
    base_dispute + np.random.uniform(-0.02, 0.02, NUM_ROWS),  # Add noise
    0.0, 0.15
)

# Generate rating_trajectory (-0.2 to 0.3)
# Slightly influenced by current rating (room for improvement if low)
rating_trajectory = np.where(
    avg_client_rating < 4.2,
    np.random.uniform(0.0, 0.3, NUM_ROWS),  # Lower ratings -> positive trajectory
    np.random.uniform(-0.2, 0.2, NUM_ROWS)   # Higher ratings -> mixed trajectory
)

# Generate project_category (categorical feature)
categories = ['UI/UX Design', 'Web Development', 'Mobile Development', 'Graphic Design']
project_category = np.random.choice(categories, NUM_ROWS)

# ============================================================================
# STEP 3: Calculate target variable - project_success_score (0-100)
# ============================================================================

# Define weights for each feature (must sum to 1.0)
WEIGHT_ON_TIME = 0.30        # 30% - Most important
WEIGHT_RATING = 0.25         # 25% - Very important
WEIGHT_PORTFOLIO = 0.15      # 15% - Moderately important
WEIGHT_TRAJECTORY = 0.12     # 12% - Good indicator
WEIGHT_PROJECTS = 0.10       # 10% - Experience matters
WEIGHT_DISPUTE = 0.08        # 8% - Negative indicator

# Normalize features to 0-1 scale for weighted calculation
norm_on_time = (on_time_delivery_percent - 0.7) / 0.3
norm_rating = (avg_client_rating - 3.5) / 1.5
norm_portfolio = (portfolio_strength - 0.5) / 0.5
norm_trajectory = (rating_trajectory + 0.2) / 0.5
norm_projects = (projects_completed - 5) / 45
norm_dispute = 1 - (dispute_rate / 0.15)  # Inverse (lower is better)

# Calculate weighted score
project_success_score = (
    WEIGHT_ON_TIME * norm_on_time +
    WEIGHT_RATING * norm_rating +
    WEIGHT_PORTFOLIO * norm_portfolio +
    WEIGHT_TRAJECTORY * norm_trajectory +
    WEIGHT_PROJECTS * norm_projects +
    WEIGHT_DISPUTE * norm_dispute
) * 100  # Scale to 0-100

# Add realistic noise to simulate real-world variance
noise = np.random.normal(0, 3, NUM_ROWS)  # Mean=0, StdDev=3
project_success_score = np.clip(project_success_score + noise, 0, 100)

# ============================================================================
# STEP 4: Calculate project_price_inr (Pricing Co-Pilot Target)
# ============================================================================

print("\nCalculating project prices based on creator metrics...")

# Calculate base price from key metrics (already normalized 0-1)
# Weight experience, portfolio, and rating for pricing
price_factor = (norm_projects * 0.4) + (norm_portfolio * 0.3) + (norm_rating * 0.3)

# Scale to a realistic INR range (50,000 to 5,00,000)
base_price = 50000 + (price_factor * 450000)

# Add realistic noise to simulate market variance
project_price_inr = np.clip(
    base_price + np.random.normal(0, 15000, NUM_ROWS),
    50000,
    500000
).astype(int)

print(f"✓ Price range generated: ₹{project_price_inr.min():,} to ₹{project_price_inr.max():,}")

# ============================================================================
# STEP 5: Create DataFrame and save to CSV
# ============================================================================

# Create the DataFrame with all columns
df = pd.DataFrame({
    'projects_completed': projects_completed,
    'tenure_months': tenure_months,
    'portfolio_strength': np.round(portfolio_strength, 2),
    'on_time_delivery_percent': np.round(on_time_delivery_percent, 2),
    'avg_client_rating': np.round(avg_client_rating, 2),
    'rating_trajectory': np.round(rating_trajectory, 2),
    'dispute_rate': np.round(dispute_rate, 3),
    'project_category': project_category,
    'project_success_score': np.round(project_success_score, 2),
    'project_price_inr': project_price_inr
})

# Save to CSV
output_file = 'creator_data.csv'
df.to_csv(output_file, index=False)

print(f"\n✓ Successfully generated {NUM_ROWS} rows of data")
print(f"✓ Saved to: {output_file}")

# ============================================================================
# STEP 6: Display summary statistics and correlations
# ============================================================================

print("\n" + "="*70)
print("DATASET SUMMARY")
print("="*70)
print(df.describe())

print("\n" + "="*70)
print("KEY CORRELATIONS")
print("="*70)
print(f"projects_completed vs tenure_months: {df['projects_completed'].corr(df['tenure_months']):.3f}")
print(f"avg_client_rating vs on_time_delivery_percent: {df['avg_client_rating'].corr(df['on_time_delivery_percent']):.3f}")
print(f"dispute_rate vs avg_client_rating: {df['dispute_rate'].corr(df['avg_client_rating']):.3f}")
print(f"project_success_score vs avg_client_rating: {df['project_success_score'].corr(df['avg_client_rating']):.3f}")
print(f"project_price_inr vs projects_completed: {df['project_price_inr'].corr(df['projects_completed']):.3f}")
print(f"project_price_inr vs avg_client_rating: {df['project_price_inr'].corr(df['avg_client_rating']):.3f}")

print("\n" + "="*70)
print("SAMPLE DATA (first 5 rows)")
print("="*70)
print(df.head())

print("\n✓ Data generation complete!")
