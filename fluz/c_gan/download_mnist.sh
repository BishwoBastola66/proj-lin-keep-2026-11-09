#!/bin/bash

echo "Downloading MNIST training images..."
curl -o train-images-idx3-ubyte.gz "https://storage.googleapis.com/cvdf-datasets/mnist/train-images-idx3-ubyte.gz"

echo "Extracting..."
gunzip -f train-images-idx3-ubyte.gz

echo "Done! Downloaded train-images-idx3-ubyte"
