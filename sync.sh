#!/bin/bash
set -e
DIRECTION=$1
BUCKET=${GO_PIPELINE_NAME:-performance.dev}

echo 'Ensuring bucket is created'
aws s3api create-bucket --bucket $BUCKET --region us-east-1

if [ "$DIRECTION" = "--up" ]; then
  echo 'Uploading latest results...'
  aws s3 cp results s3://$BUCKET --recursive
fi

if [ "$DIRECTION" = "--down" ]; then
  echo 'Downloading previous 10 average results...'
  aws s3 cp s3://$BUCKET/average results/average --recursive --page-size 10

  echo 'Downloading previous 10 max results...'
  aws s3 cp s3://$BUCKET/max results/max --recursive --page-size 10
fi
