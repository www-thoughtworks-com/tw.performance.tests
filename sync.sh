#!/bin/bash
set -e

echo 'Uploading latest results...'
aws s3 cp results s3://go.tw.image.performance --recursive

echo 'Downloading previous 20 average results...'
aws s3 cp s3://go.tw.image.performance/average results/average --recursive --page-size 20

echo 'Downloading previous 20 max results...'
aws s3 cp s3://go.tw.image.performance/max results/max --recursive --page-size 20