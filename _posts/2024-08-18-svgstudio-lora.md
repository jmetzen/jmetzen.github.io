---
layout: distill
title: "Building SVGStud.io: Fine-tuning Stable Diffusion XL for Efficient SVG Generation"
description: "SVGStud.io provides AI-based generation of SVGs based on text or image prompts. This blog post explains our approach to SVG generation based on fine-tuning of Stable Diffusion XL (SDXL) to generate raster images optimized for conversion into SVGs. By applying an end-to-end training approach with a reward signal focused on vectorizability, aesthetics, and prompt adherence, we create high-quality, concise SVGs from AI-generated images, overcoming data scarcity and copyright challenges."
giscus_comments: true
date: 2024-08-18
featured: true

authors:
  - name: Jan Hendrik Metzen
    url: https://jmetzen.github.io/
    affiliations:
      name: SVGStud.io

bibliography: jmetzen.bib

---

# Making SDXL SVG-Friendly for SVGStud.io

## Motivation

In the world of digital design, Scalable Vector Graphics (SVGs) have become a go-to format for creating crisp, scalable images that look great on any screen. Unlike raster images, which are made up of pixels, SVGs are composed of paths defined by mathematical equations. This makes them resolution-independent and perfect for applications like web design, where images need to look sharp at any size. 

However, creating SVGs has traditionally been a challenging task, requiring expertise with vector graphics editor tools like Adobe Illustrator or Inkscape. The process of manually crafting paths, shapes, and curves can be time-consuming and complex, often limiting SVG creation to those with specialized skills. Recognizing this challenge, we developed [SVGStud.io](https://svgstud.io), a platform that democratizes SVG creation by enabling users to generate SVGs effortlessly using simple text prompts or sketches. SVGStudio's [AI-powered SVG Generator](https://svgstud.io/generator.html) streamlines the design process, making vector graphic creation accessible to everyone, regardless of their technical expertise.

Generating SVGs autonomously using AI presents a unique set of challenges. The scarcity of SVG files and the dominance of raster images in existing datasets mean that training a model directly on SVGs is difficult. Moreover, copyright concerns limit the availability of permissively licensed SVGs, further narrowing the potential training set.

To overcome these obstacles, we adopted a creative approach: instead of generating SVGs directly, we decided to harness the power of a pre-trained text-to-image model such as [**Stable Diffusion XL (SDXL)**](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)  <d-cite key="podell2024sdxl"></d-cite>, to first generate raster images. These images are then converted into vector graphics using image tracing, with tools like [**potracer**](https://pypi.org/project/potracer/). This method allows us to leverage the vast capabilities of SDXL to create high-quality, vectorizable raster images.

But simply generating images isn’t enough. For the raster images to be efficiently converted into clean SVGs, they need to be tailored for vectorization—meaning they should be simple, clear, and structured in a way that they can be traced effectively. This post summarizes how we fine-tuned SDXL for this purpose.

## Fine-Tuning SDXL for SVG Generation

The fine-tuning process is essential for adapting SDXL to generate raster images that are particularly well-suited for conversion into concise SVGs. Instead of relying on a large dataset of SVG files—which is impractical—we employ an innovative end-to-end fine-tuning technique that directly optimizes the model’s output for vectorization, without requiring *any* SVG data (thus avoiding any copyright issues).

Here’s a step-by-step breakdown of how this process works:

1. **Image Generation and Prompting**: We start by generating images using the pre-trained SDXL model. These images will eventually serve as the raw material that will be converted into SVGs, and our fine-tuning focuses on adapting their properties such that they are well suited for vectorization. During finetuning, we generate SVGs for prompts of the form "{style}, monochrome, {category}". Here *style* encodes different types of SVG appearance such as "silhouette", "cartoon style", or "logo". *Monochrome* is added to the prompt to ensure that black-and-white images are generated since our focus is on monochrome SVGs. Finally, *category* encodes the actual content of the SVG; we select the query from a large number of predefined single-word categories such as different types of animals or objects. We find that training on simple single-word categories generalizes reasonable well to more complex user prompts.

2. **Reward Signal**: To ensure that these images are suitable for vectorization, we compute a differentiable reward signal based on a weighted sum of several key terms:
   - **Aesthetic Appeal**: We collect human preference data on a pairs of SVGs generated for the same prompt. Based on this, we train a linear reward model based on CLIP features extracted from the corresponding images (before tracing and SVG conversion) and a loss function based on the Bradley-Terry model <d-cite key="bradley_terry_model"></d-cite>.
   - **Prompt Adherence**: How well the SVG aligns with the user’s input text prompt. For this, we define a reward term that is based on the cosine similarity between CLIP image embedding of the generated image and CLIP text embedding of the user's prompt.
   - **Diversity**: The variety of the generated SVGs for a given prompt. For each prompt, we generate two images with SDXL and compute a dissimilarity measure on the CLIP image embeddings. We define a reward term that is proportional to this dissimilarity. We find that this reward term helps in avoiding model collapse.
   - **Binarization**: We focus on generating binary (black and white) SVGs. For each generated image, we compute pixel-wise the minimum distance to the RGB encoding of black (0, 0, 0) and white (1, 1, 1). We define a reward term corresponding to the negative average value of this difference across the generated image.
   - **Negative Prompt Avoidance**: We define a set of undesirable properties and corresponding text prompts. We then compute the average cosine distance between the CLIP image embedding of the generated image and the CLIP text embeddings of the undesirable properties. We add a reward term corresponding to the negative value of the average cosine distance.

3. **Gradient Ascent**: The reward signal is then used to guide the training of a low-rank adapter (LoRA) for SDXL. By backpropagating the reward, we adjust the LoRA parameters through gradient ascent, fine-tuning SDXL to produce raster images that  can be easily traced into elegant SVGs. For this, we have adapted [**AlignProp**](https://align-prop.github.io/) <d-cite key="prabhudesai2023aligning"></d-cite> to be compatible with SDXL and our reward function. AlignProp is very sample-efficient, allowing us to adapt SDXL for our purpose within a few GPU-hours. The flip-side is that AlignProp is conducting greedy gradient ascent without enforcing the resulting fine-tuned model to stay "close" to the original model. However, we did not observe any model collapse or divergence in practice in our case.

## Results
Below are 99 randomly uncurated (randomly selected) SVGs generated by SVGStudio:
<div>
        <a href="https://svgstud.io/svg_preview/sun_and_palm_tree/sun_and_palm_tree_5.html">
        <img src="https://svgstud.io/svgs/8142a30a65669ebfea849f31733ac0cff05898440d2fdd90c8859a610a6b69bc.svg" 
                alt="AI-generated SVG of 'sun and palm tree'" 
                title="AI-generated SVG of 'sun and palm tree'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/mulberry_tree/mulberry_tree_5.html">
        <img src="https://svgstud.io/svgs/41ea8f2a8eaf29acb1b01b4fbd1abc01cb108034bfb982349e45212380cc0818.svg" 
                alt="AI-generated SVG of 'mulberry tree'" 
                title="AI-generated SVG of 'mulberry tree'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/jelly_bean/jelly_bean_7.html">
        <img src="https://svgstud.io/svgs/d7cbe043e47bf91940e7e3223e1e6a17a4644ea9e336ad4f5747f313b33b01f9.svg" 
                alt="AI-generated SVG of 'jelly bean'" 
                title="AI-generated SVG of 'jelly bean'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/polar_bear/polar_bear_0.html">
        <img src="https://svgstud.io/svgs/b1ab78cf284ed128e33ee813be7747f6414ae006b28332c91777a312c6a965fc.svg" 
                alt="AI-generated SVG of 'polar bear'" 
                title="AI-generated SVG of 'polar bear'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/falcon_with_fedora/falcon_with_fedora_2.html">
        <img src="https://svgstud.io/svgs/7edeeb944786aae4f261b78f2cae119e6637d41c99e78fcb2f6f87e9922bc665.svg" 
                alt="AI-generated SVG of 'falcon with fedora'" 
                title="AI-generated SVG of 'falcon with fedora'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/sword_and_snake_wrapped/sword_and_snake_wrapped_1.html">
        <img src="https://svgstud.io/svgs/213ff6004562a24c4a5cbe795736bad66ef718f4e098c90548d80f50eb8a55b5.svg" 
                alt="AI-generated SVG of 'sword and snake wrapped'" 
                title="AI-generated SVG of 'sword and snake wrapped'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/squirrel_with_acorn/squirrel_with_acorn_5.html">
        <img src="https://svgstud.io/svgs/02ecb0f819a0f24042fb039f402ecd1368bcf5789a63aae894ced0dc9cfcab8e.svg" 
                alt="AI-generated SVG of 'squirrel with acorn'" 
                title="AI-generated SVG of 'squirrel with acorn'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/alder_tree/alder_tree_0.html">
        <img src="https://svgstud.io/svgs/fa57705820f858bd036776af09c005283a44081c7623c9ada7dad3ec1ffd024d.svg" 
                alt="AI-generated SVG of 'alder tree'" 
                title="AI-generated SVG of 'alder tree'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/rafting_down_rapids/rafting_down_rapids_3.html">
        <img src="https://svgstud.io/svgs/4e68e471c10b20fb18190b364129c9dbf022f2ff272b59400a096a008c31ec73.svg" 
                alt="AI-generated SVG of 'rafting down rapids'" 
                title="AI-generated SVG of 'rafting down rapids'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/cherry/cherry_4.html">
        <img src="https://svgstud.io/svgs/c64c9cfdd4784ca59daabc65ba2ea41668e56ea2bb15c06baf2cb06a127c1db3.svg" 
                alt="AI-generated SVG of 'cherry'" 
                title="AI-generated SVG of 'cherry'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/horse/horse_5.html">
        <img src="https://svgstud.io/svgs/c59584c289114fcd30e4d7b4e28855b64e0195049d7a09e02e85b8d13a0ccc10.svg" 
                alt="AI-generated SVG of 'horse'" 
                title="AI-generated SVG of 'horse'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/running_through_jungle/running_through_jungle_0.html">
        <img src="https://svgstud.io/svgs/5a23fc16ca314110e4ed440ee69f5740cc9a5d239d8db3129b342317eb34837b.svg" 
                alt="AI-generated SVG of 'running through jungle'" 
                title="AI-generated SVG of 'running through jungle'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/ash_tree/ash_tree_4.html">
        <img src="https://svgstud.io/svgs/8751af87735abe49dbe6671999f823afc754bf0f95c2fd3e3c364e595823d738.svg" 
                alt="AI-generated SVG of 'ash tree'" 
                title="AI-generated SVG of 'ash tree'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/road_bike/road_bike_0.html">
        <img src="https://svgstud.io/svgs/15aaca5f8a1de2a55e23a856e918a04224dca094b40c410a409ef6b3207a57e1.svg" 
                alt="AI-generated SVG of 'road bike'" 
                title="AI-generated SVG of 'road bike'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/valentine's_day_gift/valentine's_day_gift_5.html">
        <img src="https://svgstud.io/svgs/093e4d80f6210bd7e34c42ae260d8297add6fcf7f4b35cee1e87d4d0b9cb8e46.svg" 
                alt="AI-generated SVG of 'valentine's day gift'" 
                title="AI-generated SVG of 'valentine's day gift'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/cymbal/cymbal_0.html">
        <img src="https://svgstud.io/svgs/f00218a7b6b8a7b5d1a0817b005e184eb455b329e1cd2a80d2fb2031318a6971.svg" 
                alt="AI-generated SVG of 'cymbal'" 
                title="AI-generated SVG of 'cymbal'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/pigeon_with_pizza/pigeon_with_pizza_1.html">
        <img src="https://svgstud.io/svgs/f527a50710938d70585f6936c2eb09b0837d39b61a5b06d6d049dc217b166761.svg" 
                alt="AI-generated SVG of 'pigeon with pizza'" 
                title="AI-generated SVG of 'pigeon with pizza'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/desert_trekker/desert_trekker_4.html">
        <img src="https://svgstud.io/svgs/2049fb6015557e717914d53ed8c50c8ea8b3d071851bd1c086ec4d89bf7aa0fb.svg" 
                alt="AI-generated SVG of 'desert trekker'" 
                title="AI-generated SVG of 'desert trekker'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/great_white_shark/great_white_shark_1.html">
        <img src="https://svgstud.io/svgs/747d6e1fee10bf2e4fc232a2f213d08c45dee5d5297f88b318011aeedc8c52ed.svg" 
                alt="AI-generated SVG of 'great white shark'" 
                title="AI-generated SVG of 'great white shark'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/waterfall_in_forest/waterfall_in_forest_5.html">
        <img src="https://svgstud.io/svgs/8058ada2c66c2aab8478ef3df3d1007fe81483110344394d9ebd06588f7a64d6.svg" 
                alt="AI-generated SVG of 'waterfall in forest'" 
                title="AI-generated SVG of 'waterfall in forest'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/meat_balls/meat_balls_6.html">
        <img src="https://svgstud.io/svgs/25fb13ab42cf5bf8528b6456157c41ca651b052d134236c1613af5655ed72c25.svg" 
                alt="AI-generated SVG of 'meat balls'" 
                title="AI-generated SVG of 'meat balls'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/castle/castle_7.html">
        <img src="https://svgstud.io/svgs/ea6899e4bb5926b166250aad93597d151234fc261d19786efe966098712dca54.svg" 
                alt="AI-generated SVG of 'castle'" 
                title="AI-generated SVG of 'castle'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/falcon/falcon_4.html">
        <img src="https://svgstud.io/svgs/b0a5cf788430e2b8210d627ebc45d2c21cf454349258f97e5d12d30f5f1af301.svg" 
                alt="AI-generated SVG of 'falcon'" 
                title="AI-generated SVG of 'falcon'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/tea_set/tea_set_5.html">
        <img src="https://svgstud.io/svgs/a3629a1ae862c707f1fa6bc1cc73b5a0660d1416894bc49105520e47469855c9.svg" 
                alt="AI-generated SVG of 'tea set'" 
                title="AI-generated SVG of 'tea set'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/laozi/laozi_7.html">
        <img src="https://svgstud.io/svgs/5405613cf5a6d3c08a64dbc792b441b9ea99af02408976e71a86c9e32cfb5493.svg" 
                alt="AI-generated SVG of 'laozi'" 
                title="AI-generated SVG of 'laozi'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/glass/glass_1.html">
        <img src="https://svgstud.io/svgs/5fde429e570257928abb9e0cfc3cfa4ba3a30fd5ac066583a795973dd4e6626a.svg" 
                alt="AI-generated SVG of 'glass'" 
                title="AI-generated SVG of 'glass'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/julius_caesar/julius_caesar_0.html">
        <img src="https://svgstud.io/svgs/a5c3337eac5337ed7ba76d0990870fea2e6199724936177647c32405fe6c5725.svg" 
                alt="AI-generated SVG of 'julius caesar'" 
                title="AI-generated SVG of 'julius caesar'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/iguana/iguana_6.html">
        <img src="https://svgstud.io/svgs/0b80d6b271b32c4447772e409b78b80302f3f0b799e8efda22f78255189a401b.svg" 
                alt="AI-generated SVG of 'iguana'" 
                title="AI-generated SVG of 'iguana'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/scott_fitzgerald/scott_fitzgerald_0.html">
        <img src="https://svgstud.io/svgs/ee0db7908eb835493a5b0b38691179327c0f711cd1e18559cfc8f7abe66af90a.svg" 
                alt="AI-generated SVG of 'scott fitzgerald'" 
                title="AI-generated SVG of 'scott fitzgerald'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/fashion_designer/fashion_designer_6.html">
        <img src="https://svgstud.io/svgs/2b6fc276f968f6fd7eadcd980777e32750ef2ab26dcfcaa9bc61b285e0da3854.svg" 
                alt="AI-generated SVG of 'fashion designer'" 
                title="AI-generated SVG of 'fashion designer'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/poker_card/poker_card_4.html">
        <img src="https://svgstud.io/svgs/2217d2625d750b9e8f43a73186412f88d82c7574fa22deed91d441d6c9e3a6c1.svg" 
                alt="AI-generated SVG of 'poker card'" 
                title="AI-generated SVG of 'poker card'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/wedding_rings/wedding_rings_0.html">
        <img src="https://svgstud.io/svgs/1c1d766de16ed26eb3a56508157d4c9868b49cf46c03b300f5aaebd3cfe4d678.svg" 
                alt="AI-generated SVG of 'wedding rings'" 
                title="AI-generated SVG of 'wedding rings'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/sassafras_tree/sassafras_tree_4.html">
        <img src="https://svgstud.io/svgs/a5c526dca582501e8b7a0acbfb098670e2bea0a3d6249d42574eb7dba8663876.svg" 
                alt="AI-generated SVG of 'sassafras tree'" 
                title="AI-generated SVG of 'sassafras tree'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/target/target_3.html">
        <img src="https://svgstud.io/svgs/4afe1c6f816c0de980f26f1e30504b63d0432e24de60402dfdd7e611e13b736d.svg" 
                alt="AI-generated SVG of 'target'" 
                title="AI-generated SVG of 'target'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/hairdresser/hairdresser_5.html">
        <img src="https://svgstud.io/svgs/80f161823621d59e967baa57ae868efb7f6528e23e2b81f4b7b7b20ca8d5d6c7.svg" 
                alt="AI-generated SVG of 'hairdresser'" 
                title="AI-generated SVG of 'hairdresser'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/light_rail/light_rail_4.html">
        <img src="https://svgstud.io/svgs/6814f11e4249e360f0df558e07536f90ef5d95d86da8350f066420437012a500.svg" 
                alt="AI-generated SVG of 'light rail'" 
                title="AI-generated SVG of 'light rail'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/sword/sword_2.html">
        <img src="https://svgstud.io/svgs/8ffaab3ead11b195bb0f22f217d8379f9618450309f2ac8e48ded65e35633018.svg" 
                alt="AI-generated SVG of 'sword'" 
                title="AI-generated SVG of 'sword'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/marduk/marduk_6.html">
        <img src="https://svgstud.io/svgs/860317f411b1b4da3271520c4f6ffdc239388e414c065802a4e7e265b58ec9f9.svg" 
                alt="AI-generated SVG of 'marduk'" 
                title="AI-generated SVG of 'marduk'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/christmas_lights/christmas_lights_0.html">
        <img src="https://svgstud.io/svgs/1e9fe19a2a7edc584e37cddab0eea3f4737af9baf334729aad84c81604458f23.svg" 
                alt="AI-generated SVG of 'christmas lights'" 
                title="AI-generated SVG of 'christmas lights'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/lime_tree/lime_tree_3.html">
        <img src="https://svgstud.io/svgs/70678099b41ccbcad6a9f316f157af882c0171d11cce1c035753b484d17605e8.svg" 
                alt="AI-generated SVG of 'lime tree'" 
                title="AI-generated SVG of 'lime tree'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/pole/pole_3.html">
        <img src="https://svgstud.io/svgs/8641a90812c88b7f43e55a0376251b5ff8074fd73c37d8a05b45e9a10fea9caa.svg" 
                alt="AI-generated SVG of 'pole'" 
                title="AI-generated SVG of 'pole'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/mountain_retreat/mountain_retreat_6.html">
        <img src="https://svgstud.io/svgs/004f777833535cfdc4c978e1616e0e11dc5ca63c8246777c189bb90a721ab885.svg" 
                alt="AI-generated SVG of 'mountain retreat'" 
                title="AI-generated SVG of 'mountain retreat'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/baseball/baseball_3.html">
        <img src="https://svgstud.io/svgs/d476e0c432dbea807c25bee53b8874ce9941f15b5f76870da40ec257c2870c84.svg" 
                alt="AI-generated SVG of 'baseball'" 
                title="AI-generated SVG of 'baseball'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/panel_van/panel_van_1.html">
        <img src="https://svgstud.io/svgs/7843f89b83fa768ca4739cb4e434622a967b57ddf6cf9e94c18b57ccdfbb5b57.svg" 
                alt="AI-generated SVG of 'panel van'" 
                title="AI-generated SVG of 'panel van'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/onion/onion_5.html">
        <img src="https://svgstud.io/svgs/87efec9a0074a6f018f8c3361f85669e96a18598ee754e4dba6b5860b1aef88f.svg" 
                alt="AI-generated SVG of 'onion'" 
                title="AI-generated SVG of 'onion'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/hiking_trail/hiking_trail_4.html">
        <img src="https://svgstud.io/svgs/d5df4785c7dbad5e616ee851f72522d40cd1d2e11db63f5e320c9084cbeb91f9.svg" 
                alt="AI-generated SVG of 'hiking trail'" 
                title="AI-generated SVG of 'hiking trail'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/folder/folder_7.html">
        <img src="https://svgstud.io/svgs/31fba1660d2a4f2a881d975e8df5d7b6e9633815f034ff1462f44dec585e102e.svg" 
                alt="AI-generated SVG of 'folder'" 
                title="AI-generated SVG of 'folder'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/edinburgh_castle/edinburgh_castle_1.html">
        <img src="https://svgstud.io/svgs/82e1a79a80f50872fefc1c7f48c30955e71274b39c89e229e968b8967d2806d1.svg" 
                alt="AI-generated SVG of 'edinburgh castle'" 
                title="AI-generated SVG of 'edinburgh castle'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/cute_raccoon_cartoon/cute_raccoon_cartoon_7.html">
        <img src="https://svgstud.io/svgs/1dad934b7fcdc8ee23d3ad5f40cb2609606b9a19798d4e44ea8d80d697325215.svg" 
                alt="AI-generated SVG of 'cute raccoon cartoon'" 
                title="AI-generated SVG of 'cute raccoon cartoon'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/hummingbird_with_harmonica/hummingbird_with_harmonica_3.html">
        <img src="https://svgstud.io/svgs/cd66ef38da381c4d0951d90713d9c100b23509164a7d8accb3a58cba9c9e8564.svg" 
                alt="AI-generated SVG of 'hummingbird with harmonica'" 
                title="AI-generated SVG of 'hummingbird with harmonica'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/tea_set/tea_set_1.html">
        <img src="https://svgstud.io/svgs/9095762af7ccfaaad233189c72d52b8f8279ec1c9f3d00983311387c591b6525.svg" 
                alt="AI-generated SVG of 'tea set'" 
                title="AI-generated SVG of 'tea set'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/picture_frame/picture_frame_3.html">
        <img src="https://svgstud.io/svgs/aaf466194d9d770672cd7692c3973405ec97681103f1818144f06f958641a522.svg" 
                alt="AI-generated SVG of 'picture frame'" 
                title="AI-generated SVG of 'picture frame'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/fairy/fairy_5.html">
        <img src="https://svgstud.io/svgs/99a4dff0ee6d1424926eeee377d7d07148af590966e815584fc71d3d4933d14d.svg" 
                alt="AI-generated SVG of 'fairy'" 
                title="AI-generated SVG of 'fairy'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/tropical_rainforest_trek/tropical_rainforest_trek_5.html">
        <img src="https://svgstud.io/svgs/1c7e60b1dd754a4b87cebbc3fc8373e8b32c03bf8f79b59f06f94d08fd7a0332.svg" 
                alt="AI-generated SVG of 'tropical rainforest trek'" 
                title="AI-generated SVG of 'tropical rainforest trek'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/radiator/radiator_7.html">
        <img src="https://svgstud.io/svgs/32acb98079fadac35b18f7749f94cabc3d4b1a9b2f67bae1262e2507b5f7c0f2.svg" 
                alt="AI-generated SVG of 'radiator'" 
                title="AI-generated SVG of 'radiator'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/couple_on_a_boat/couple_on_a_boat_7.html">
        <img src="https://svgstud.io/svgs/33cf854df9fd0922eca6117e526b41f299544a8bc9679f10e434e57b3801b4d7.svg" 
                alt="AI-generated SVG of 'couple on a boat'" 
                title="AI-generated SVG of 'couple on a boat'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/sculpture/sculpture_6.html">
        <img src="https://svgstud.io/svgs/4763e639f30345d26f7f9d7b990cc13c628f3e5ba36ee135802090722a09e6db.svg" 
                alt="AI-generated SVG of 'sculpture'" 
                title="AI-generated SVG of 'sculpture'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/saxophone/saxophone_2.html">
        <img src="https://svgstud.io/svgs/85cb9efbee471844203b5f084331e3fd6197e07015aa3b6530bae03639ed0c16.svg" 
                alt="AI-generated SVG of 'saxophone'" 
                title="AI-generated SVG of 'saxophone'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/carl_jung/carl_jung_7.html">
        <img src="https://svgstud.io/svgs/575ead32225e02ce054af1008c17f7d9504a86431be2805e3aa8067df132ca28.svg" 
                alt="AI-generated SVG of 'carl jung'" 
                title="AI-generated SVG of 'carl jung'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/alexander_graham_bell/alexander_graham_bell_1.html">
        <img src="https://svgstud.io/svgs/051f0ebb471ded0415562e1d55fe1dfd757d7e9699d127a8cbef8bbe42b7f8f3.svg" 
                alt="AI-generated SVG of 'alexander graham bell'" 
                title="AI-generated SVG of 'alexander graham bell'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/tree_and_swing/tree_and_swing_4.html">
        <img src="https://svgstud.io/svgs/80934a9de62a322fe80fac1ea4a1c3864f57505dfdd035b5419fd1a18fe97c3b.svg" 
                alt="AI-generated SVG of 'tree and swing'" 
                title="AI-generated SVG of 'tree and swing'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/horse-drawn_carriage/horse-drawn_carriage_0.html">
        <img src="https://svgstud.io/svgs/62e7a70402d3c795739a0e6868ffd8323eca3ee8a1b9e4e76d602c4a8994dc3d.svg" 
                alt="AI-generated SVG of 'horse-drawn carriage'" 
                title="AI-generated SVG of 'horse-drawn carriage'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/fire_hydrant/fire_hydrant_4.html">
        <img src="https://svgstud.io/svgs/ce7bf97ac906edfd12ad4ebd3f817858b775c65caeef73198c1eb4d0ec3b6bcc.svg" 
                alt="AI-generated SVG of 'fire hydrant'" 
                title="AI-generated SVG of 'fire hydrant'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/dinosaurs/dinosaurs_6.html">
        <img src="https://svgstud.io/svgs/c7824b3e074c714ef863bf3836b20e25d82a87cd10d8f36c31982d936dd198b2.svg" 
                alt="AI-generated SVG of 'dinosaurs'" 
                title="AI-generated SVG of 'dinosaurs'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/samosa/samosa_4.html">
        <img src="https://svgstud.io/svgs/5586d29e06e382679199c431e93e8ae212acbd24e17bac2e51f3d88602a2331c.svg" 
                alt="AI-generated SVG of 'samosa'" 
                title="AI-generated SVG of 'samosa'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/dentist/dentist_5.html">
        <img src="https://svgstud.io/svgs/a18aa8d98852dc6c5b9b2275041cd53921d8b828f7c274996ee5908a0fffc9cc.svg" 
                alt="AI-generated SVG of 'dentist'" 
                title="AI-generated SVG of 'dentist'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/day_of_dead/day_of_dead_2.html">
        <img src="https://svgstud.io/svgs/5dcdaffd7775726e2ac484a1a7e0da935e85e7a47133a5c09b87ec1b0d4b3fcb.svg" 
                alt="AI-generated SVG of 'day of dead'" 
                title="AI-generated SVG of 'day of dead'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/guitar/guitar_3.html">
        <img src="https://svgstud.io/svgs/cb526aff6b8798fd5343085af9e6bd0186f91e9bc8af2150c7acafc567ff1741.svg" 
                alt="AI-generated SVG of 'guitar'" 
                title="AI-generated SVG of 'guitar'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/flaxseed/flaxseed_5.html">
        <img src="https://svgstud.io/svgs/15a4da3f34d7caccdf0c51e738c5578d7724e0e546f208a2bac2e4b1945a840b.svg" 
                alt="AI-generated SVG of 'flaxseed'" 
                title="AI-generated SVG of 'flaxseed'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/unicorn/unicorn_4.html">
        <img src="https://svgstud.io/svgs/aa8d6b77a8c957eebb0caf2951b797690e820441b9067ba59dda7e2800e00443.svg" 
                alt="AI-generated SVG of 'unicorn'" 
                title="AI-generated SVG of 'unicorn'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/jungle_canopy_bridge/jungle_canopy_bridge_5.html">
        <img src="https://svgstud.io/svgs/18cd1aed62845b98baae178a10eb06a5249b93cea3df4a0f3b32ca75d2cb0631.svg" 
                alt="AI-generated SVG of 'jungle canopy bridge'" 
                title="AI-generated SVG of 'jungle canopy bridge'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/rose/rose_7.html">
        <img src="https://svgstud.io/svgs/ace2a3229d427e6b5c80354386f7586b217b6184e3379f3181fd3da9d84c8bc0.svg" 
                alt="AI-generated SVG of 'rose'" 
                title="AI-generated SVG of 'rose'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/crutch/crutch_0.html">
        <img src="https://svgstud.io/svgs/82b5f9c1148b37ac92c5f3dd5e668f984a9a7f69e2d3265ddb893041e4a39cd6.svg" 
                alt="AI-generated SVG of 'crutch'" 
                title="AI-generated SVG of 'crutch'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/squash/squash_0.html">
        <img src="https://svgstud.io/svgs/415672fcd3ff82808841ea1f33fe64a5698cbe528c3f7dd09916bc8a3f4e91b6.svg" 
                alt="AI-generated SVG of 'squash'" 
                title="AI-generated SVG of 'squash'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/penguin_with_fish/penguin_with_fish_5.html">
        <img src="https://svgstud.io/svgs/5c78a62ff961f72fb7e588dd346faeb8328adf6c1d97bb1db6e76be28ff8b01b.svg" 
                alt="AI-generated SVG of 'penguin with fish'" 
                title="AI-generated SVG of 'penguin with fish'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/cactus/cactus_1.html">
        <img src="https://svgstud.io/svgs/27b3ea1fb2362b2167ff40ab1f4a7b94f347ff98ade60247f813aa275afe2522.svg" 
                alt="AI-generated SVG of 'cactus'" 
                title="AI-generated SVG of 'cactus'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/pablo_picasso/pablo_picasso_1.html">
        <img src="https://svgstud.io/svgs/909ce9553019974765340078992febfdd0131129a1d2f76fff90974b44f98167.svg" 
                alt="AI-generated SVG of 'pablo picasso'" 
                title="AI-generated SVG of 'pablo picasso'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/sunflower_seed/sunflower_seed_7.html">
        <img src="https://svgstud.io/svgs/d110fea51399012ccb49b728858f2837a3607b3e61f0b5f19848abb381d6f41a.svg" 
                alt="AI-generated SVG of 'sunflower seed'" 
                title="AI-generated SVG of 'sunflower seed'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/toilet/toilet_2.html">
        <img src="https://svgstud.io/svgs/9c88ef24ea0f7984ebb89aa3369db66d7e0480c97828ca1c5d418bc4fdcbb43f.svg" 
                alt="AI-generated SVG of 'toilet'" 
                title="AI-generated SVG of 'toilet'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/marigold/marigold_1.html">
        <img src="https://svgstud.io/svgs/97e95a75042f5d2d70f3c0c2bf0c225b60221b048456ae97a11e61e72c56a0b9.svg" 
                alt="AI-generated SVG of 'marigold'" 
                title="AI-generated SVG of 'marigold'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/nighttime_city_exploration/nighttime_city_exploration_0.html">
        <img src="https://svgstud.io/svgs/9c6f162facfef93e0b4e7cea98560a2255b51ef6b1ff7044919442c55c4fe8f1.svg" 
                alt="AI-generated SVG of 'nighttime city exploration'" 
                title="AI-generated SVG of 'nighttime city exploration'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/woodland_path/woodland_path_7.html">
        <img src="https://svgstud.io/svgs/c7c4d4921e3b6d8255952b360ae94b9a9abf8695668e3d44a39e44a186f1e4b4.svg" 
                alt="AI-generated SVG of 'woodland path'" 
                title="AI-generated SVG of 'woodland path'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/tanker_truck/tanker_truck_5.html">
        <img src="https://svgstud.io/svgs/8138d1aa076297ce8cccba89efab358ebc88622f7d5fab423101eb12e9a989ea.svg" 
                alt="AI-generated SVG of 'tanker truck'" 
                title="AI-generated SVG of 'tanker truck'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/bookshelf/bookshelf_5.html">
        <img src="https://svgstud.io/svgs/b773daf554eaf8e5f754b891c3554c0c670f9a72672c23b2efd31d34b5d149cf.svg" 
                alt="AI-generated SVG of 'bookshelf'" 
                title="AI-generated SVG of 'bookshelf'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/anteater/anteater_0.html">
        <img src="https://svgstud.io/svgs/fbb312d42a8c1845b617275d8bd9fdb28ddb749f8f3bfb61cdfe06e347dd52ac.svg" 
                alt="AI-generated SVG of 'anteater'" 
                title="AI-generated SVG of 'anteater'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/treasure_hunt/treasure_hunt_0.html">
        <img src="https://svgstud.io/svgs/4e3c0f257eb39c6229e0676b486237474ac31889533381a8c1c6d6ce87d07b0c.svg" 
                alt="AI-generated SVG of 'treasure hunt'" 
                title="AI-generated SVG of 'treasure hunt'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/chimp_with_drum/chimp_with_drum_5.html">
        <img src="https://svgstud.io/svgs/9c6541c4cd132ce110812d61bd6b3fc124fffb7c66ff7a6443616d5d39869ce9.svg" 
                alt="AI-generated SVG of 'chimp with drum'" 
                title="AI-generated SVG of 'chimp with drum'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/piano/piano_4.html">
        <img src="https://svgstud.io/svgs/c2b1b191b895313ea436ff0b26173e165e7f2637f6f9f77f0cc66507ddc49202.svg" 
                alt="AI-generated SVG of 'piano'" 
                title="AI-generated SVG of 'piano'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/moose_with_briefcase/moose_with_briefcase_2.html">
        <img src="https://svgstud.io/svgs/884f17601d2f7ecab8df0eeb59ad883e968a9fe1c437b57c8dc28482dd161544.svg" 
                alt="AI-generated SVG of 'moose with briefcase'" 
                title="AI-generated SVG of 'moose with briefcase'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/bowl/bowl_0.html">
        <img src="https://svgstud.io/svgs/0764446467591ef9a40aa0dfe60f99c1f68c46583a215183c57a740da3f3441b.svg" 
                alt="AI-generated SVG of 'bowl'" 
                title="AI-generated SVG of 'bowl'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/red_cabbage/red_cabbage_5.html">
        <img src="https://svgstud.io/svgs/30a851d9428cb87b459f802b2f5b3d5f17de70aad94a8d81f8f094386f4dd104.svg" 
                alt="AI-generated SVG of 'red cabbage'" 
                title="AI-generated SVG of 'red cabbage'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/nikola_tesla/nikola_tesla_4.html">
        <img src="https://svgstud.io/svgs/530a2950a6fc54c05f8b0c7da5bb1285ff21c7e3a35a70294be15e1a2371c763.svg" 
                alt="AI-generated SVG of 'nikola tesla'" 
                title="AI-generated SVG of 'nikola tesla'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/primrose/primrose_2.html">
        <img src="https://svgstud.io/svgs/5f132fb926068989d2c6a62429e7b066de9b7a819e78cb112ce7de6e53fcda83.svg" 
                alt="AI-generated SVG of 'primrose'" 
                title="AI-generated SVG of 'primrose'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/kiosk/kiosk_7.html">
        <img src="https://svgstud.io/svgs/755d1cdaf58e5ae6a615ae97b2fe9d7f2a6f9f6c36ae964590ef89d714dc034c.svg" 
                alt="AI-generated SVG of 'kiosk'" 
                title="AI-generated SVG of 'kiosk'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/hathor/hathor_0.html">
        <img src="https://svgstud.io/svgs/0a23ad15080db565ecf0fd7b2a0749867f3add64c743c0d1c652cc7b99a68d66.svg" 
                alt="AI-generated SVG of 'hathor'" 
                title="AI-generated SVG of 'hathor'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/yogurt/yogurt_4.html">
        <img src="https://svgstud.io/svgs/ae3a8687ec4444f4c1b65b36c00671c2562067a91fca234d6c9c3fca53a08aa0.svg" 
                alt="AI-generated SVG of 'yogurt'" 
                title="AI-generated SVG of 'yogurt'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/romantic_beach_walk/romantic_beach_walk_7.html">
        <img src="https://svgstud.io/svgs/50d2ddcc063c1ede6b95b5c625ff9a04b8a568a620b4d279ffd966d2e46d6a5a.svg" 
                alt="AI-generated SVG of 'romantic beach walk'" 
                title="AI-generated SVG of 'romantic beach walk'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/wine/wine_1.html">
        <img src="https://svgstud.io/svgs/e03a93678c574f0d34b9545a5624a73b6207ca825f2d757e8f86bc3758875c9c.svg" 
                alt="AI-generated SVG of 'wine'" 
                title="AI-generated SVG of 'wine'" 
                style="width: 32%;">
        </a>
        <a href="https://svgstud.io/svg_preview/lamp_post/lamp_post_0.html">
        <img src="https://svgstud.io/svgs/f58f30e4f391c6091be810e29c9e8ac21912d3f0b8cea3737a80f2c116f2d514.svg" 
                alt="AI-generated SVG of 'lamp post'" 
                title="AI-generated SVG of 'lamp post'" 
                style="width: 32%;">
        </a>   
</div>

## Conclusion

The LoRA fine-tuning process of SDXL is crucial because it allows us to circumvent the limitations of direct SVG generation. By focusing on generating raster images that are easy to vectorize, we can produce SVGs that are both visually appealing and structurally concise. This approach not only mitigates the challenges posed by limited SVG data but also ensures that the generated SVGs are of high quality and diverse in style.

The result is a powerful AI-based SVG generator that can create stunning, scalable graphics from scratch, tailored to meet the needs of modern digital design. You can try out our [AI-powered SVG Generator](https://svgstud.io/generator.html) for free!