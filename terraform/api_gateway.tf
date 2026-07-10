resource "aws_api_gateway_rest_api" "main" {
  name = "peerreview-api"
}

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "peerreview-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.main.arn]
  identity_source = "method.request.header.Authorization"
}

# ---- resources ----
resource "aws_api_gateway_resource" "me" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "me"
}

resource "aws_api_gateway_resource" "products" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "products"
}

resource "aws_api_gateway_resource" "product_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "assignment" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "assignment"
}

resource "aws_api_gateway_resource" "assignment_submit" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.assignment.id
  path_part   = "submit"
}

resource "aws_api_gateway_resource" "assignment_skip" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.assignment.id
  path_part   = "skip"
}

resource "aws_api_gateway_resource" "incoming" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "incoming"
}

resource "aws_api_gateway_resource" "incoming_verify" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.incoming.id
  path_part   = "verify"
}

resource "aws_api_gateway_resource" "incoming_flag" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.incoming.id
  path_part   = "flag"
}

resource "aws_api_gateway_resource" "member" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "member"
}

resource "aws_api_gateway_resource" "member_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.member.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "leaderboard" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "leaderboard"
}

resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "webhook"
}

resource "aws_api_gateway_resource" "webhook_payment" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.webhook.id
  path_part   = "payment"
}

# ---------------------------------------------------------------------------
# Route table: resource, http_method, lambda, auth
# ---------------------------------------------------------------------------
locals {
  routes = {
    get_me = {
      resource_id = aws_api_gateway_resource.me.id
      method      = "GET"
      fn          = "me"
      auth        = true
    }
    put_me = {
      resource_id = aws_api_gateway_resource.me.id
      method      = "PUT"
      fn          = "me"
      auth        = true
    }
    get_products = {
      resource_id = aws_api_gateway_resource.products.id
      method      = "GET"
      fn          = "products"
      auth        = true
    }
    save_product = {
      resource_id = aws_api_gateway_resource.products.id
      method      = "POST"
      fn          = "products"
      auth        = true
    }
    delete_product = {
      resource_id = aws_api_gateway_resource.product_id.id
      method      = "DELETE"
      fn          = "products"
      auth        = true
    }
    get_assignment = {
      resource_id = aws_api_gateway_resource.assignment.id
      method      = "GET"
      fn          = "assignment"
      auth        = true
    }
    submit_review = {
      resource_id = aws_api_gateway_resource.assignment_submit.id
      method      = "POST"
      fn          = "assignment"
      auth        = true
    }
    skip_assignment = {
      resource_id = aws_api_gateway_resource.assignment_skip.id
      method      = "POST"
      fn          = "assignment"
      auth        = true
    }
    get_incoming = {
      resource_id = aws_api_gateway_resource.incoming.id
      method      = "GET"
      fn          = "incoming"
      auth        = true
    }
    verify_review = {
      resource_id = aws_api_gateway_resource.incoming_verify.id
      method      = "POST"
      fn          = "incoming"
      auth        = true
    }
    flag_review = {
      resource_id = aws_api_gateway_resource.incoming_flag.id
      method      = "POST"
      fn          = "incoming"
      auth        = true
    }
    get_member = {
      resource_id = aws_api_gateway_resource.member_id.id
      method      = "GET"
      fn          = "member"
      auth        = true
    }
    get_leaderboard = {
      resource_id = aws_api_gateway_resource.leaderboard.id
      method      = "GET"
      fn          = "leaderboard"
      auth        = false # public leaderboard is a landing-page trust signal
    }
    webhook_payment = {
      resource_id = aws_api_gateway_resource.webhook_payment.id
      method      = "POST"
      fn          = "webhook-payment"
      auth        = false # LemonSqueezy signs the payload instead
    }
  }

  cors_resources = {
    me                = aws_api_gateway_resource.me.id
    products          = aws_api_gateway_resource.products.id
    product_id        = aws_api_gateway_resource.product_id.id
    assignment        = aws_api_gateway_resource.assignment.id
    assignment_submit = aws_api_gateway_resource.assignment_submit.id
    assignment_skip   = aws_api_gateway_resource.assignment_skip.id
    incoming          = aws_api_gateway_resource.incoming.id
    incoming_verify   = aws_api_gateway_resource.incoming_verify.id
    incoming_flag     = aws_api_gateway_resource.incoming_flag.id
    member_id         = aws_api_gateway_resource.member_id.id
    leaderboard       = aws_api_gateway_resource.leaderboard.id
  }
}

resource "aws_api_gateway_method" "route" {
  for_each = local.routes

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.resource_id
  http_method   = each.value.method
  authorization = each.value.auth ? "COGNITO_USER_POOLS" : "NONE"
  authorizer_id = each.value.auth ? aws_api_gateway_authorizer.cognito.id : null

  request_parameters = contains(["delete_product", "get_member"], each.key) ? {
    "method.request.path.id" = true
  } : {}
}

resource "aws_api_gateway_integration" "route" {
  for_each = local.routes

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = each.value.resource_id
  http_method             = aws_api_gateway_method.route[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.fn[each.value.fn].invoke_arn
}

resource "aws_lambda_permission" "apigw" {
  for_each = local.functions

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  # LaunchPad note: wildcard is deliberate — exact method/path ARNs are easy
  # to get subtly wrong and buy nothing here.
  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# ---- CORS (mock OPTIONS on every browser-called resource) ----
resource "aws_api_gateway_method" "cors" {
  for_each      = local.cors_resources
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cors" {
  for_each    = local.cors_resources
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.cors[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "cors" {
  for_each    = local.cors_resources
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.cors[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "cors" {
  for_each    = local.cors_resources
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.cors[each.key].http_method
  status_code = aws_api_gateway_method_response.cors[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      local.routes,
      aws_api_gateway_method.route,
      aws_api_gateway_integration.route,
      aws_api_gateway_method.cors,
      aws_api_gateway_integration.cors,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.route,
    aws_api_gateway_integration.cors,
  ]
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"
}

# LaunchPad lesson: API Gateway's own 401/403/5xx responses ship without CORS
# headers, so the browser reports them as network failures instead of auth
# errors — cover the default and the authorizer-specific response types.
resource "aws_api_gateway_gateway_response" "default_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }
}

resource "aws_api_gateway_gateway_response" "default_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }
}

resource "aws_api_gateway_gateway_response" "unauthorized" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "UNAUTHORIZED"
  status_code   = "401"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }
}

resource "aws_api_gateway_gateway_response" "expired_token" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "EXPIRED_TOKEN"
  status_code   = "401"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }
}

resource "aws_api_gateway_gateway_response" "access_denied" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "ACCESS_DENIED"
  status_code   = "403"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }
}
