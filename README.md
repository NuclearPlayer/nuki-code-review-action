# Nuki Code Review Action

This GitHub Action reviews new pull requests using OpenAI's GPT-4.

## Inputs

### `OPENAI_API_KEY`

**Required** The OpenAI API Key. This is used to authenticate requests to the OpenAI API.

## Usage

To use this action, you can create a `.github/workflows/main.yml` in your repository like the following:

```yaml
name: Code Review
on: [pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Nuki Code Review
      uses: NuclearPlayer/nuki-code-review-action@v1
      with:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

