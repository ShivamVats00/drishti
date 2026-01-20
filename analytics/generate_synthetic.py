import polars as pl
import numpy as np
from datetime import datetime, timedelta
import random
import os

def generate_synthetic_data(days=60, districts=5):
    """Generates synthetic CSV data for testing."""
    
    start_date = datetime.today() - timedelta(days=days)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]
    
    state = "Karnataka"
    district_names = [f"District_{i}" for i in range(1, districts + 1)]
    pincodes = [f"56000{i}" for i in range(1, districts + 1)]
    
    enrolment_data = []
    biometric_data = []
    
    for district, pincode in zip(district_names, pincodes):
        for date in dates:
            
            age_0_5 = np.random.poisson(10)
            age_5_17 = np.random.poisson(15)
            age_18_plus = np.random.normal(5, 2)
            

            if district == "District_1" and date in dates[-3:]:
                 age_18_plus += 500 
            
            enrolment_data.append({
                "date": date,
                "state": state,
                "district": district,
                "pincode": pincode,
                "age_0_5": max(0, int(age_0_5)),
                "age_5_17": max(0, int(age_5_17)),
                "age_18_greater": max(0, int(age_18_plus))
            })

            bio_5_17 = np.random.normal(50, 5)
            
            
            if district == "District_2" and date in dates[-5:]:
                bio_5_17 = 5 
            
            biometric_data.append({
                "date": date,
                "state": state,
                "district": district,
                "pincode": pincode,
                "bio_age_5_17": max(0, int(bio_5_17)),
                "bio_age_17_": max(0, int(np.random.normal(20, 5)))
            })

    df_enrol = pl.DataFrame(enrolment_data)
    df_bio = pl.DataFrame(biometric_data)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    df_enrol.write_csv(os.path.join(base_dir, "enrolment.csv"))
    df_bio.write_csv(os.path.join(base_dir, "biometric.csv"))
    
    print(f"Generated synthetic data in {base_dir}")

if __name__ == "__main__":
    generate_synthetic_data()
