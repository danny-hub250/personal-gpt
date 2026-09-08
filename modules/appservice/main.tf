# 챗 웹앱을 호스팅하는 Linux App Service (코드 배포, 컨테이너 미사용)

resource "azurerm_service_plan" "this" {
  name                = "${var.name}-plan"
  resource_group_name = var.resource_group_name
  location            = var.location

  os_type  = "Linux"
  sku_name = var.sku_name

  tags = var.tags
}

resource "azurerm_linux_web_app" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.this.id

  # 무료(F1)/공유 SKU는 always_on을 지원하지 않으므로 자동 분기.
  https_only = true

  site_config {
    always_on = var.sku_name == "F1" || var.sku_name == "D1" ? false : true

    application_stack {
      node_version = var.node_version
    }
  }

  # Azure OpenAI 호출 시 API Key 대신 사용할 Managed Identity.
  identity {
    type = "SystemAssigned"
  }

  app_settings = merge(
    {
      # Oryx 빌드(npm install)를 배포 시 App Service에서 수행하도록 설정.
      "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
      "WEBSITE_NODE_DEFAULT_VERSION"   = var.node_version
    },
    var.app_settings
  )

  tags = var.tags
}
