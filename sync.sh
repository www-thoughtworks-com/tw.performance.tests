#!/bin/bash
set -e

BUCKET=${GO_PIPELINE_NAME:-performance.dev}

echo 'Ensuring bucket is created'
aws s3api create-bucket --bucket $BUCKET --region us-east-1

echo 'Uploading latest results...'
aws s3 cp results s3://$BUCKET --recursive

echo 'Downloading previous 10 average results...'
aws s3 cp s3://$BUCKET/average results/average --recursive --page-size 10

echo 'Downloading previous 10 max results...'
aws s3 cp s3://$BUCKET/max results/max --recursive --page-size 10
