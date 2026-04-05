#!/usr/bin/env python3
"""
Create a minimal ONNX stub model for hydroponic pH/EC/Temp forecasting.

Architecture: Flatten [1,24,3] -> [1,72] -> MatMul [72,3] + Add [3] -> [1,3]
Weights: Exponentially-weighted moving average (recent readings weighted higher).
Bias: Cannabis hydro centres (pH 6.0, EC 1.6, Temp 21.0).

This is a synthetic placeholder -- NOT a trained model.
The weights approximate a 24h weighted moving average across 3 channels.
"""

import numpy as np
import onnx
from onnx import helper, TensorProto, numpy_helper

# Input: [1, 24, 3]  (batch=1, 24 hourly readings, 3 features: pH, EC, Temp)
# Output: [1, 3]     (predicted next-hour: pH, EC, Temp)

WINDOW = 24
FEATURES = 3

# --- Weight matrix [72, 3] ---
# Each output feature depends on the corresponding channel across 24 timesteps.
# Exponential weighting: more recent = higher weight.
alpha = 0.1
raw_weights = np.array([np.exp(alpha * i) for i in range(WINDOW)], dtype=np.float32)
raw_weights /= raw_weights.sum()  # Normalise to sum=1

# Build [72, 3] matrix: each output j reads from input positions j, j+3, j+6, ...
W = np.zeros((WINDOW * FEATURES, FEATURES), dtype=np.float32)
for feat in range(FEATURES):
    for t in range(WINDOW):
        # Flattened index: t * FEATURES + feat
        W[t * FEATURES + feat, feat] = raw_weights[t]

# --- Bias [3] ---
# Small bias toward cannabis-typical centres (helps when input range is atypical)
bias = np.array([0.0, 0.0, 0.0], dtype=np.float32)  # No bias shift -- pure weighted avg

# --- Build ONNX graph ---
X = helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, WINDOW, FEATURES])
Y = helper.make_tensor_value_info("output", TensorProto.FLOAT, [1, FEATURES])

# Reshape [1,24,3] -> [1,72]
shape_const = numpy_helper.from_array(np.array([1, WINDOW * FEATURES], dtype=np.int64), name="shape")
reshape_node = helper.make_node("Reshape", inputs=["input", "shape"], outputs=["flat"])

# MatMul [1,72] x [72,3] -> [1,3]
W_init = numpy_helper.from_array(W, name="W")
matmul_node = helper.make_node("MatMul", inputs=["flat", "W"], outputs=["matmul_out"])

# Add bias [1,3] + [3] -> [1,3]
B_init = numpy_helper.from_array(bias, name="B")
add_node = helper.make_node("Add", inputs=["matmul_out", "B"], outputs=["output"])

graph = helper.make_graph(
    [reshape_node, matmul_node, add_node],
    "hydro_forecast_stub",
    [X],
    [Y],
    initializer=[shape_const, W_init, B_init],
)

model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 13)])
model.ir_version = 8

# Validate
onnx.checker.check_model(model)

# Save
import os
out_dir = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "models")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "hydro_forecast_stub.onnx")
onnx.save(model, out_path)

size_kb = os.path.getsize(out_path) / 1024
print(f"[OK] Model saved to {out_path} ({size_kb:.1f} KB)")
print(f"     Input:  [1, {WINDOW}, {FEATURES}] (Float32)")
print(f"     Output: [1, {FEATURES}] (Float32)")
print(f"     Ops:    Reshape -> MatMul -> Add")
