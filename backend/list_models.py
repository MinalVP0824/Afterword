"""Prints every model your API key can use. Run: python list_models.py"""

from openai import OpenAI

from app import config

client = OpenAI(api_key=config.LLM_API_KEY, base_url=config.LLM_BASE_URL)

print(f"Provider: {config.LLM_BASE_URL}\n")
for model in sorted(client.models.list(), key=lambda m: m.id):
    print(model.id)