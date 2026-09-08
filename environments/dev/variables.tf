variable "location" {
  type    = string
  default = "koreacentral"
}

variable "tags" {
  type = map(string)
  default = {
    owner = "personal-gpt"
    env   = "dev"
  }
}

variable "app_service_sku" {
  description = "채팅 웹앱을 호스팅할 App Service Plan SKU"
  type        = string
  default     = "B1"
}
