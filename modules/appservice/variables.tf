variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "sku_name" {
  description = "App Service Plan SKU (예: F1, B1, B2, P0v3). 개인 학습용은 B1 권장"
  type        = string
  default     = "B1"
}

variable "node_version" {
  description = "Node.js 런타임 버전 (Linux App Service application_stack 형식, 예: 20-lts)"
  type        = string
  default     = "20-lts"
}

variable "app_settings" {
  description = "Web App에 주입할 추가 애플리케이션 설정(App Settings)"
  type        = map(string)
  default     = {}
}
