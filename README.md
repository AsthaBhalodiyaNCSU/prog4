# WebGL Program 4: Texture Mapping, Lighting, and Blending

This application is a WebGL scene viewer that supports texture mapping combined with lighting, object manipulation, camera controls, different blending modes (including full transparency), and an object animation system.

---

## 🚀 Features

This program extends previous capabilities with the following key features:

### 1. Advanced Blending Modes
The shader now supports three distinct blending modes, controlled by the **B** key:

| Mode | Key | Description |
| :--- | :--- | :--- |
| **0** | Press **B** | **Replace (Texture Only):** Shows only the raw texture color, ignoring all lighting calculations. |
| **1** | Press **B** | **Modulate (Texture × Lighting):** Multiplies the texture color by the calculated Phong lighting model (`Ambient + Diffuse + Specular`). This is the standard textured/lit mode. |
| **2** | Press **B** | **Modulate with Transparency:** Applies lighting and texture, and also uses the `alpha` value from the material for transparency. This mode uses a two-pass rendering approach to correctly handle depth and transparent objects. |

### 2. London Bridge Animation
A custom, looping animation simulates the "London Bridge is Falling Down" scenario by moving and rotating three designated triangle sets.

| Key | Action |
| :--- | :--- |
| **!** (Exclamation Mark) | **Toggle Animation:** Starts and stops the 4-second breaking and rebuilding animation loop. When stopped, objects revert to their original state. |

---

## 🕹️ Controls and Interaction

### Camera/View Controls

| Key | Action | Behavior |
| :--- | :--- | :--- |
| **W** | Move Forward | Moves both the Eye and Center point forward. |
| **S** | Move Backward | Moves both the Eye and Center point backward. |
| **A** | Strafe Left | Moves both the Eye and Center point left (relative to view). |
| **D** | Strafe Right | Moves both the Eye and Center point right (relative to view). |
| **Q** | Move Up | Moves both the Eye and Center point up (world Y-axis). |
| **E** | Move Down | Moves both the Eye and Center point down (world Y-axis). |
| **Shift + W/S/A/D** | Move Center/Up | Moves the **Center** point only, changing the view direction. |
| **Shift + Q/E** | Rotate Up | Rotates the **Up** vector relative to the view right vector. |
| **Esc** | Reset View | Resets the camera (Eye, Center, Up) to their initial default positions. |

### Model Selection and Manipulation

First, select a model, then use the transformation keys.

| Key | Action | Description |
| :--- | :--- | :--- |
| **Right/Left Arrow** | Select Triangle Set | Cycles forward/backward through loaded triangle sets. |
| **Up/Down Arrow** | Select Ellipsoid | Cycles forward/backward through loaded ellipsoids. |
| **Space** | Deselect | Clears the current model selection. |
| **Backspace** | Reset Models | Resets the translation and rotation of all loaded models. |
| **I / P** | Translate Up/Down | Moves the selected model along the view's Up axis. |
| **O / L** | Translate Forward/Backward | Moves the selected model along the view's LookAt axis. |
| **K / ;** | Translate Left/Right | Moves the selected model along the view's Right axis. |
| **Shift + I/P** | Rotate Z | Rotates the model around the view's LookAt (Z) axis. |
| **Shift + O/L** | Rotate X | Rotates the model around the view's Right (X) axis. |
| **Shift + K/;** | Rotate Y | Rotates the model around the view's Up (Y) axis. |

---

## 🛠️ Implementation Details (Blending Mode 2)

Mode 2, "Modulate with Transparency," requires careful rendering order:

1.  **Depth Mask Enabled (Opaque Pass):** All objects with an `alpha` value of `>= 1.0` are rendered first. This populates the depth buffer correctly.
2.  **Depth Mask Disabled (Transparent Pass):** All objects with an `alpha` value of `< 1.0` are rendered second. Depth testing is still active (`gl.enable(gl.DEPTH_TEST)`), but depth *writing* is disabled (`gl.depthMask(false)`). This ensures transparent objects do not incorrectly hide subsequent transparent objects that are further away.
3.  **Blending Enabled:** `gl.enable(gl.BLEND)` with `gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)` is used to combine the transparent object's color with the background/opaque scene colors.
