import argparse
import os
import torch
from diffusers import FluxPipeline

def main():
    parser = argparse.ArgumentParser(description="Generate images using FLUX.1-schnell")
    parser.add_argument("prompt", type=str, help="The prompt to generate the image from")
    parser.add_argument("--output", type=str, default="images/output.png", help="Path to save the generated image")
    args = parser.parse_args()

    # Ensure the output directory exists if a directory path was provided
    output_dir = os.path.dirname(args.output)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    print("Loading FLUX.1-schnell model...")
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.1-schnell",
        torch_dtype=torch.bfloat16
    )
    pipe.enable_sequential_cpu_offload()  # Maximum memory savings
    pipe.vae.enable_tiling()              # Saves memory during VAE decoding

    print(f"Generating image for prompt: '{args.prompt}'...")
    image = pipe(
        args.prompt,
        guidance_scale=0.0,
        num_inference_steps=4,
        max_sequence_length=256
    ).images[0]
    
    image.save(args.output)
    print(f"Image successfully saved to {args.output}")

if __name__ == "__main__":
    main()
