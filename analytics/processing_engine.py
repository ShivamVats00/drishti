import polars as pl
from datetime import datetime, timedelta
import os

# Define strict schemas matches the expected CSV format
enrolment_schema = {
    "date": pl.Utf8,
    "state": pl.Utf8,
    "district": pl.Utf8,
    "pincode": pl.Utf8,
    "age_0_5": pl.Int32,
    "age_5_17": pl.Int32,
    "age_18_greater": pl.Int32
}

biometric_schema = {
    "date": pl.Utf8,
    "state": pl.Utf8,
    "district": pl.Utf8,
    "pincode": pl.Utf8,
    "bio_age_5_17": pl.Int32,
    "bio_age_17_": pl.Int32
}

def load_and_prep_data(file_path: str, schema: dict) -> pl.DataFrame:
    """Ingest and clean CSV data."""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return pl.DataFrame()

    df = pl.read_csv(file_path, schema=schema)
    df = df.with_columns(
        pl.col("date").str.strptime(pl.Date, format="%Y-%m-%d"),
        pl.col("state").str.strip_chars(".").str.strip_chars() 
    )
    return df

def calculate_mbu_baseline(df_bio: pl.DataFrame) -> pl.DataFrame:
    """30-day rolling average of child biometric updates."""
    if df_bio.is_empty(): return df_bio
    
    return (
        df_bio.sort("date")
       .group_by(["state", "district", "date"])
       .agg([
            pl.col("bio_age_5_17").sum().alias("daily_mbu_count")
        ])
       .sort("date")
       .with_columns([
            pl.col("daily_mbu_count")
           .rolling_mean(window_size=30, min_periods=1)
           .over(["state", "district"])
           .alias("baseline_mbu_30d_avg")
        ])
    )

def calculate_adult_enrolment_baseline(df_enrol: pl.DataFrame) -> pl.DataFrame:
    """Statistical baseline (Mean/StdDev) for adult enrolments."""
    if df_enrol.is_empty(): return df_enrol

    return (
        df_enrol
       .group_by(["state", "district"])
       .agg([
            pl.col("age_18_greater").mean().alias("avg_adult_daily"),
            pl.col("age_18_greater").std().alias("std_adult_daily")
        ])
    )

def detect_adult_enrolment_anomalies(df_enrol: pl.DataFrame, df_baseline: pl.DataFrame) -> pl.DataFrame:
    """Z-Score > 3 Detection for Adult Enrolments."""
    if df_enrol.is_empty() or df_baseline.is_empty(): return pl.DataFrame()

    return (
        df_enrol
       .join(df_baseline, on=["state", "district"])
       .with_columns([
            ((pl.col("age_18_greater") - pl.col("avg_adult_daily")) / 
             (pl.col("std_adult_daily") + 0.001))
           .alias("z_score")
        ])
       .filter(pl.col("z_score") > 3)
       .select(["date", "state", "district", "age_18_greater", "z_score"])
       .sort("z_score", descending=True)
    )

def detect_mbu_cliffs(df_mbu_trends: pl.DataFrame) -> pl.DataFrame:
    """Detects drops < 50% of baseline for 3 consecutive days."""
    if df_mbu_trends.is_empty(): return pl.DataFrame()

    return (
        df_mbu_trends
       .with_columns([
            (pl.col("daily_mbu_count") < (pl.col("baseline_mbu_30d_avg") * 0.5))
           .alias("is_low_performance")
        ])
       .with_columns([
            pl.col("is_low_performance")
           .cast(pl.Int32)
           .rolling_sum(window_size=3)
           .over(["state", "district"])
           .alias("consecutive_low_days")
        ])
       .filter(pl.col("consecutive_low_days") >= 3)
    )

def main():
    print("Starting Processing Engine...")
    
    # Paths (Assuming generated files are in same dir)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    enrol_path = os.path.join(base_dir, "enrolment.csv")
    bio_path = os.path.join(base_dir, "biometric.csv")

    df_enrol = load_and_prep_data(enrol_path, enrolment_schema)
    df_bio = load_and_prep_data(bio_path, biometric_schema)

    if not df_enrol.is_empty():
        print("Calculating Adult Enrolment Baselines...")
        baseline_adult = calculate_adult_enrolment_baseline(df_enrol)
        anomalies_adult = detect_adult_enrolment_anomalies(df_enrol, baseline_adult)
        print(f"Found {len(anomalies_adult)} Adult Enrolment Anomalies (Ghost Village).")
        # In a real scenario, we would write these to DB here.
        # anomalies_adult.write_csv("anomalies_adult.csv")

    if not df_bio.is_empty():
        print("Calculating MBU Baselines...")
        df_mbu = calculate_mbu_baseline(df_bio)
        mbu_cliffs = detect_mbu_cliffs(df_mbu)
        print(f"Found {len(mbu_cliffs)} MBU Cliff Events.")
        # mbu_cliffs.write_csv("anomalies_mbu.csv")

    print("Processing Complete.")

if __name__ == "__main__":
    main()
