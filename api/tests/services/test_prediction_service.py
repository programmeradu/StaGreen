import pytest
import pandas as pd
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock # For mocking DB and joblib
import joblib # To check if it's called, or to mock its behavior
import os

# Module to be tested
from api.services import prediction_service
# Adjust import path if your project structure requires it e.g. from ....services
# This assumes your tests will run from a context where 'api' is a package.
# For local testing from root: `python -m pytest api/tests`

# Ensure MODEL_DIR and MODEL_PATH are aligned with the service for testing
TEST_MODEL_DIR = "api/models_ml_test" # Use a separate dir for test models
TEST_MODEL_PATH = os.path.join(TEST_MODEL_DIR, "waste_predictor_ghana_test.joblib")

@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """ Ensure a clean test environment for model paths and directories. """
    # Override the model path used by the service during tests
    monkeypatch.setattr(prediction_service, 'MODEL_DIR', TEST_MODEL_DIR)
    monkeypatch.setattr(prediction_service, 'MODEL_PATH', TEST_MODEL_PATH)

    # Create the test model directory if it doesn't exist
    os.makedirs(TEST_MODEL_DIR, exist_ok=True)

    # Clean up any test model file before each test
    if os.path.exists(TEST_MODEL_PATH):
        os.remove(TEST_MODEL_PATH)

    yield # Test runs here

    # Clean up after tests if needed (e.g., remove TEST_MODEL_DIR)
    # For now, just removing the model file is fine.
    if os.path.exists(TEST_MODEL_PATH):
        os.remove(TEST_MODEL_PATH)
    # Consider removing TEST_MODEL_DIR if it was created and is empty
    # if os.path.exists(TEST_MODEL_DIR) and not os.listdir(TEST_MODEL_DIR):
    #     os.rmdir(TEST_MODEL_DIR)


@pytest.fixture
def sample_raw_df():
    """Provides a sample raw DataFrame similar to what MongoDB might return."""
    return pd.DataFrame([
        {"_id": "1", "bin_id": "B001", "fill_level_percent": 50.0, "reading_timestamp": datetime(2023, 1, 1, 10, 0, 0)},
        {"_id": "2", "bin_id": "B001", "fill_level_percent": 60.0, "reading_timestamp": datetime(2023, 1, 1, 12, 0, 0)},
        {"_id": "3", "bin_id": "B002", "fill_level_percent": 30.0, "reading_timestamp": datetime(2023, 1, 1, 9, 0, 0)},
        {"_id": "4", "bin_id": "B001", "fill_level_percent": 75.0, "reading_timestamp": datetime(2023, 1, 2, 10, 0, 0)},
    ])

@pytest.fixture
def sample_featured_df(sample_raw_df):
    """Provides a sample DataFrame after feature engineering."""
    # Minimal feature engineering for testing structure
    df = sample_raw_df.copy()
    df['reading_timestamp'] = pd.to_datetime(df['reading_timestamp'])
    df['day_of_week'] = df['reading_timestamp'].dt.dayofweek
    df['hour_of_day'] = df['reading_timestamp'].dt.hour
    df['day_of_year'] = df['reading_timestamp'].dt.dayofyear
    return df

def test_fetch_waste_readings_data_empty(monkeypatch):
    """Test fetching data when the collection is empty."""
    mock_collection = MagicMock()
    mock_collection.find.return_value = [] # Simulate empty collection

    # Patch 'get_collection' in the prediction_service module
    monkeypatch.setattr(prediction_service, 'get_collection', MagicMock(return_value=mock_collection))

    df = prediction_service.fetch_waste_readings_data()
    assert df.empty
    prediction_service.get_collection.assert_called_once_with("waste_readings")

def test_fetch_waste_readings_data_with_data(monkeypatch, sample_raw_df):
    """Test fetching data when the collection has data."""
    # Convert DataFrame rows to dicts, as pymongo cursor would yield dicts
    sample_data_dicts = sample_raw_df.to_dict('records')

    mock_collection = MagicMock()
    mock_collection.find.return_value = sample_data_dicts
    monkeypatch.setattr(prediction_service, 'get_collection', MagicMock(return_value=mock_collection))

    df = prediction_service.fetch_waste_readings_data()
    assert not df.empty
    assert len(df) == len(sample_raw_df)
    pd.testing.assert_frame_equal(df, sample_raw_df, check_dtype=False) # Dtypes might differ slightly after mongo roundtrip if not careful

def test_engineer_features_empty_df():
    """Test feature engineering with an empty DataFrame."""
    df = pd.DataFrame()
    featured_df = prediction_service.engineer_features(df)
    assert featured_df.empty

def test_engineer_features_valid_df(sample_raw_df):
    """Test feature engineering with a valid DataFrame."""
    featured_df = prediction_service.engineer_features(sample_raw_df.copy()) # Pass a copy
    assert not featured_df.empty
    assert 'day_of_week' in featured_df.columns
    assert 'hour_of_day' in featured_df.columns
    assert 'day_of_year' in featured_df.columns
    assert pd.api.types.is_datetime64_any_dtype(featured_df['reading_timestamp'])

# More tests for train_waste_prediction_model and predict_fill_levels will be added next.
# For train_waste_prediction_model, we'll need to mock joblib.dump.
# For predict_fill_levels, we'll need to mock joblib.load and a dummy model.

@patch('api.services.prediction_service.fetch_waste_readings_data') # Mock data fetching
@patch('api.services.prediction_service.engineer_features')   # Mock feature engineering
@patch('joblib.dump')                                       # Mock model saving
def test_train_waste_prediction_model_success(
    mock_joblib_dump,
    mock_engineer_features,
    mock_fetch_data,
    sample_featured_df # Use a fixture that provides data *after* feature engineering
):
    """Test successful model training and saving."""
    # Configure mocks
    # train_waste_prediction_model calls fetch_waste_readings_data and then engineer_features internally.
    # So, we mock fetch_waste_readings_data to return a "raw" df,
    # and mock engineer_features to return a "featured" df.

    # Raw df for fetch_waste_readings_data mock
    raw_df_for_mock = pd.DataFrame({
        'reading_timestamp': [datetime.now() - timedelta(days=x) for x in range(10)],
        'fill_level_percent': [50 + x for x in range(10)], # Ensure enough data points
        'bin_id': ['B001'] * 10
    })
    # Ensure the raw_df_for_mock also includes 'fill_level_percent' as it's checked in train_waste_prediction_model
    # before calling engineer_features.
    mock_fetch_data.return_value = raw_df_for_mock

    # Featured df for engineer_features mock (must contain target and features)
    # The actual features don't matter as much as their presence for the mock model.fit
    # sample_featured_df already has 'fill_level_percent' from its source sample_raw_df
    mock_engineer_features.return_value = sample_featured_df[
        ['day_of_week', 'hour_of_day', 'day_of_year', 'fill_level_percent']
    ].copy() # Use .copy() to avoid modifying the fixture if it's used elsewhere after this


    result = prediction_service.train_waste_prediction_model()

    assert result is True
    mock_fetch_data.assert_called_once()
    # Check that engineer_features was called with the DataFrame returned by mock_fetch_data.
    # We need to compare the DataFrame content. Using pd.testing.assert_frame_equal inside a try-except
    # or checking a specific unique value might be more robust than direct DataFrame comparison.
    # For simplicity here, we assume the call was made. A more detailed check would be:
    # pd.testing.assert_frame_equal(mock_engineer_features.call_args[0][0], raw_df_for_mock.copy())
    mock_engineer_features.assert_called_once()

    mock_joblib_dump.assert_called_once()
    args, _ = mock_joblib_dump.call_args
    assert args[1] == TEST_MODEL_PATH


@patch('api.services.prediction_service.fetch_waste_readings_data')
def test_train_waste_prediction_model_no_data(mock_fetch_data):
    """Test model training when no data is fetched."""
    mock_fetch_data.return_value = pd.DataFrame() # Empty DataFrame

    result = prediction_service.train_waste_prediction_model()
    assert result is False

@patch('api.services.prediction_service.fetch_waste_readings_data')
@patch('api.services.prediction_service.engineer_features')
def test_train_waste_prediction_model_feature_engineering_fails(mock_engineer_features, mock_fetch_data, sample_raw_df):
    """Test model training when feature engineering returns an empty DataFrame."""
    mock_fetch_data.return_value = sample_raw_df # Return some raw data (must include 'fill_level_percent')
    mock_engineer_features.return_value = pd.DataFrame() # Simulate feature engineering failure

    result = prediction_service.train_waste_prediction_model()
    assert result is False


@patch('joblib.load')
@patch('api.services.prediction_service.engineer_features') # Also used by predict_fill_levels
def test_predict_fill_levels_success(mock_engineer_features, mock_joblib_load, sample_featured_df):
    """Test successful prediction."""
    mock_model = MagicMock()
    mock_model.predict.return_value = [75.5]
    mock_joblib_load.return_value = mock_model

    single_prediction_features = sample_featured_df[['day_of_week', 'hour_of_day', 'day_of_year']].head(1)
    mock_engineer_features.return_value = single_prediction_features

    with patch('os.path.exists') as mock_os_exists:
        mock_os_exists.return_value = True

        prediction = prediction_service.predict_fill_levels(
            bin_id="B001",
            future_timestamp=datetime(2023, 1, 3, 10, 0, 0)
        )

    assert prediction == 75.50
    mock_joblib_load.assert_called_once_with(TEST_MODEL_PATH)
    mock_model.predict.assert_called_once()

    # Check the DataFrame passed to engineer_features
    # It should be a DataFrame with one row and a 'reading_timestamp' column
    call_args = mock_engineer_features.call_args[0][0] # Get the first positional argument
    assert isinstance(call_args, pd.DataFrame)
    assert len(call_args) == 1
    assert 'reading_timestamp' in call_args.columns
    assert call_args['reading_timestamp'].iloc[0] == pd.to_datetime(datetime(2023, 1, 3, 10, 0, 0))


@patch('os.path.exists')
def test_predict_fill_levels_model_not_found(mock_os_exists):
    """Test prediction when the model file is not found."""
    mock_os_exists.return_value = False

    prediction = prediction_service.predict_fill_levels(
        bin_id="B001",
        future_timestamp=datetime(2023, 1, 3, 10, 0, 0)
    )
    assert prediction is None
    mock_os_exists.assert_called_once_with(TEST_MODEL_PATH)

@patch('os.path.exists')
@patch('joblib.load')
@patch('api.services.prediction_service.engineer_features')
def test_predict_fill_levels_feature_engineering_fails_for_prediction(
    mock_engineer_features,
    mock_joblib_load,
    mock_os_exists
):
    """Test prediction when feature engineering fails for the input timestamp."""
    mock_os_exists.return_value = True
    # mock_joblib_load is implicitly used because os.path.exists is true,
    # but if engineer_features fails, model.predict won't be called.
    # We don't need to mock_joblib_load.return_value unless engineer_features succeeds.

    mock_engineer_features.return_value = pd.DataFrame() # Simulate failure

    prediction = prediction_service.predict_fill_levels(
        bin_id="B001",
        future_timestamp=datetime(2023, 1, 3, 10, 0, 0)
    )
    assert prediction is None
