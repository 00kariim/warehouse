from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database (read-only, used by NL2SQL)
    database_url: str

    # OpenRouter / LLM
    openrouter_api_key: str
    openrouter_model: str = "qwen/qwen-2.5-72b-instruct"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Isolation Forest model
    model_path: str = "/app/models/anomaly_model.pkl"

    # NL2SQL limits
    nl_max_rows: int = 500
    nl_query_timeout_secs: int = 8


settings = Settings()
