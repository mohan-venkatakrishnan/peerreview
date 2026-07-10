resource "aws_dynamodb_table" "users" {
  name         = "peerreview-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "email"
    type = "S"
  }

  # LemonSqueezy webhook only knows the payer's email — resolve email -> userId
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "products" {
  name         = "peerreview-products"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "productId"

  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "productId"
    type = "S"
  }
  attribute {
    name = "poolStatus"
    type = "S"
  }
  attribute {
    name = "enqueuedAt"
    type = "S"
  }

  # Sparse matching pool: only products with poolStatus="queued" appear, oldest first
  global_secondary_index {
    name            = "pool-index"
    hash_key        = "poolStatus"
    range_key       = "enqueuedAt"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "assignments" {
  name         = "peerreview-assignments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "assignmentId"

  attribute {
    name = "assignmentId"
    type = "S"
  }
  attribute {
    name = "reviewerId"
    type = "S"
  }
  attribute {
    name = "ownerId"
    type = "S"
  }
  attribute {
    name = "assignedAt"
    type = "S"
  }
  attribute {
    name = "state"
    type = "S"
  }

  # "my queue" + review history for a reviewer
  global_secondary_index {
    name            = "reviewer-index"
    hash_key        = "reviewerId"
    range_key       = "assignedAt"
    projection_type = "ALL"
  }

  # "incoming reviews to verify" for an owner
  global_secondary_index {
    name            = "owner-index"
    hash_key        = "ownerId"
    range_key       = "assignedAt"
    projection_type = "ALL"
  }

  # sweep scans for active assignments past dueAt (state is the sparse-ish key)
  global_secondary_index {
    name            = "state-index"
    hash_key        = "state"
    range_key       = "assignedAt"
    projection_type = "ALL"
  }
}
