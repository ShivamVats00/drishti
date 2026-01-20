import polars as pl
from datetime import datetime
import os
import glob

# Define schemas based on actual CSV headers
enrolment_schema = {
    "date": pl.Utf8,
    "state": pl.Utf8,
    "district": pl.Utf8,
    "pincode": pl.Int64, 
    "age_0_5": pl.Int32,
    "age_5_17": pl.Int32,
    "age_18_greater": pl.Int32 
}

biometric_schema = {
    "date": pl.Utf8,
    "state": pl.Utf8,
    "district": pl.Utf8,
    "pincode": pl.Int64,
    "bio_age_5_17": pl.Int32,
    "bio_age_17_": pl.Int32
}

def load_data_from_pattern(pattern: str, schema_overrides: dict) -> pl.DataFrame:
    """Finds all files matching a pattern and loads them into a single DataFrame."""
    files = glob.glob(pattern)
    if not files:
        print(f"No files found for pattern: {pattern}")
        return pl.DataFrame()
    
    print(f"Found {len(files)} files for pattern '{pattern}'. Loading...")
    
    dfs = []
    for file in files:
        try:
            # infer_schema_length=10000 helps detecting types better than default 100
            # We treat pincode as string if possible to avoid losing leading zeros, but here schemas say Int64.
            # Let's try to trust the schema if provided, but Polars CSV reader with schema is strict.
            # If the CSV has "123" (int) and we say param "pincode": pl.Utf8, it might complain or cast.
            # Best approach for mixed files: read with inference, then cast.
            
            df = pl.read_csv(file, infer_schema_length=10000)
            
            # Normalize column names if needed (e.g. trim spaces)
            df.columns = [c.strip() for c in df.columns]
            
            dfs.append(df)
        except Exception as e:
            print(f"Error loading {file}: {e}")

    if not dfs:
        return pl.DataFrame()

    combined_df = pl.concat(dfs, how="vertical")
    
    # Standardize Date (DD-MM-YYYY -> Date Object)
    if "date" in combined_df.columns:
        combined_df = combined_df.with_columns(
            pl.col("date").str.strptime(pl.Date, format="%d-%m-%Y", strict=False)
        )
        
    return combined_df

def calculate_mbu_baseline(df_bio: pl.DataFrame) -> pl.DataFrame:
    """30-day rolling average of child biometric updates."""
    if df_bio.is_empty(): return df_bio
    
    # Ensure date is sorted
    df_bio = df_bio.sort("date")
    
    return (
        df_bio
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

    # Enrolment CSV has 'age_18_greater' based on our check
    if "age_18_greater" not in df_enrol.columns:
        print("Column 'age_18_greater' not found in enrolment data.")
        print("Available columns:", df_enrol.columns)
        return pl.DataFrame()

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
    print("Starting Multi-File Processing Engine...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Patterns for the new split files
    enrol_pattern = os.path.join(base_dir, "api_data_aadhar_enrolment_*.csv")
    bio_pattern = os.path.join(base_dir, "api_data_aadhar_biometric_*.csv")
    
    df_enrol = load_data_from_pattern(enrol_pattern, enrolment_schema)
    df_bio = load_data_from_pattern(bio_pattern, biometric_schema)

    print(f"Loaded Enrolment Rows: {len(df_enrol)}")
    print(f"Loaded Biometric Rows: {len(df_bio)}")

    
    # Collect anomalies for DB export
    all_anomalies = []

    if not df_enrol.is_empty():
        print("Calculating Adult Enrolment Baselines...")
        baseline_adult = calculate_adult_enrolment_baseline(df_enrol)
        anomalies_adult = detect_adult_enrolment_anomalies(df_enrol, baseline_adult)
        print(f"Found {len(anomalies_adult)} Adult Enrolment Anomalies (Ghost Village).")
        
        if not anomalies_adult.is_empty():
            # Standardize for export: date, state, district, type, severity, z_score
            df_adult_exp = anomalies_adult.select([
                pl.col("date"),
                pl.col("state"),
                pl.col("district"),
                pl.lit("GHOST_VILLAGE").alias("type"),
                pl.lit("CRITICAL").alias("severity"),
                pl.col("z_score")
            ])
            all_anomalies.append(df_adult_exp)

    if not df_bio.is_empty():
        print("Calculating MBU Baselines...")
        df_mbu = calculate_mbu_baseline(df_bio)
        mbu_cliffs = detect_mbu_cliffs(df_mbu)
        print(f"Found {len(mbu_cliffs)} MBU Cliff Events.")
        
        if not mbu_cliffs.is_empty():
             df_mbu_exp = mbu_cliffs.select([
                pl.col("date"),
                pl.col("state"),
                pl.col("district"),
                pl.lit("MBU_CLIFF").alias("type"),
                pl.lit("HIGH").alias("severity"),
                pl.lit(0.0).alias("z_score") # No Z-Score for simple threshold
            ])
             all_anomalies.append(df_mbu_exp)

    # Export Anomalies
    if all_anomalies:
        df_all_anomalies = pl.concat(all_anomalies, how="vertical")
        anomaly_path = os.path.join(base_dir, "anomalies_import.csv")
        df_all_anomalies.write_csv(anomaly_path)
        print(f"Exported {len(df_all_anomalies)} anomalies to {anomaly_path}")

    if not df_enrol.is_empty() and not df_bio.is_empty():
        print("Merging Enrolment and Biometric Data for DB Export...")
        
        # Join on key columns. Pincode might vary or be consistently 1-1 with district.
        # Safest is to join on State, District, Date.
        # We assume one pincode per district for simplicity in this dataset, or take the first.
        
        # Aggregating by District/Date first to handle duplicates if any
        df_enrol_agg = df_enrol.group_by(["date", "state", "district", "pincode"]).sum()
        df_bio_agg = df_bio.group_by(["date", "state", "district", "pincode"]).sum() # pincode is in group keys

        # Outer Join
        df_final = df_enrol_agg.join(
            df_bio_agg, 
            on=["date", "state", "district", "pincode"], 
            how="outer"
        ).fill_null(0)
        
        output_path = os.path.join(base_dir, "db_ready_data.csv")
        df_final.write_csv(output_path)
        print(f"Exported unified data to {output_path}")

    print("Processing Complete.")

if __name__ == "__main__":
    main()
