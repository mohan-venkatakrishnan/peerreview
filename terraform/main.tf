terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = { App = "peerreview", Environment = "production" }
  }
}

# Amplify CreateApp is persistently throttled for this account in us-east-1
# (confirmed over ~7h; us-west-2 works). Hosting region doesn't matter — the
# app is served from Amplify's CDN either way.
provider "aws" {
  alias  = "uswest2"
  region = "us-west-2"

  default_tags {
    tags = { App = "peerreview", Environment = "production" }
  }
}
