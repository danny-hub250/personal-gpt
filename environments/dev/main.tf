# personal-gpt : ChatGPT 스타일 웹페이지 + Azure AI Foundry(gpt-5.6 계열) 백엔드
# 개인 학습용 구성 - VNet/Private Endpoint 없이 공개 엔드포인트로 구성한다.

locals {
  # Foundry 계정명(custom subdomain), Web App 이름은 Azure 전역에서 유일해야 함.
  # 이름 충돌 시 이 prefix를 바꿔서 재배포할 것.
  name_prefix = "danny-personal-gpt"
}

module "rg" {
  source   = "../../modules/resourcegroup"
  name     = "${local.name_prefix}-dev-rg"
  location = var.location
  tags     = var.tags
}

# --- Azure AI Foundry (모델: gpt-5.6, gpt-5.6-astra) ---

module "foundry" {
  source = "../../modules/foundry"

  name                = "${local.name_prefix}-dev-msf"
  location            = var.location
  resource_group_name = module.rg.name
  tags                = var.tags

  model_deployments = {
    # "gpt-5.6", "gpt-5.6-astra"는 실재하지 않는 모델명이라 실제 사용 가능한 모델로 대체함
    # (az cognitiveservices model list --location eastus2 로 확인).
    "gpt-5.6-sol" = {
      model_name    = "gpt-5.6-sol"
      model_version = "2026-07-09"
      capacity      = 1000
    }
    "gpt-6-astra" = {
      model_name    = "gpt-6-astra"
      model_version = "2026-09-03"
      capacity      = 1000
    }
  }
}

# --- 챗 웹앱 (App Service, Node.js 코드 배포) ---

module "webapp" {
  source = "../../modules/appservice"

  name                = "${local.name_prefix}-dev-app"
  location            = var.location
  resource_group_name = module.rg.name
  sku_name            = var.app_service_sku
  tags                = var.tags

  app_settings = {
    # API Key 없이 Managed Identity(azure-identity DefaultAzureCredential)로 인증한다.
    "AZURE_OPENAI_ENDPOINT"    = module.foundry.endpoint
    # "2026-01-01-preview"는 실재하지 않는 api-version이라 404를 반환함(services.ai.azure.com에서 직접 검증).
    # 2025-04-01-preview까지는 정상 라우팅 확인됨 - GA 버전인 2024-10-21을 사용.
    "AZURE_OPENAI_API_VERSION" = "2024-10-21"
    # 프런트엔드 모델 선택 드롭다운에 노출할 배포 이름 목록 (콤마 구분).
    "AZURE_OPENAI_DEPLOYMENTS" = join(",", module.foundry.deployment_names)
  }
}

# Web App의 Managed Identity가 API Key 없이 Foundry(Azure OpenAI)를 호출할 수 있도록 역할 부여.
module "webapp_openai_role" {
  source = "../../modules/roleassignment"

  scope                = module.foundry.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = module.webapp.principal_id
}
