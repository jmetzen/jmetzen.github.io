---
layout: about
title: About
permalink: /
subtitle: Research Scientist at Prior Labs · Tabular Foundation Models · Scalable Pretraining

profile:
  align: right
  image: prof_pic.png
  alt: Portrait of Jan Hendrik Metzen
  image_circular: false # crops the image to make it circular
  address: >
    <p></p>

news: true  # includes a list of news items
latest_posts: false  # the blog remains available, but is not highlighted on the homepage
selected_papers: true # includes a list of papers marked as "selected={true}"
social: true  # includes social icons at the bottom of the page
---

I am a Research Scientist at [Prior Labs](https://priorlabs.ai/), where I develop the next generation of tabular foundation models. My work focuses on scalable pretraining, novel architectures, and scaling laws. I contribute to [TabPFN-3](https://arxiv.org/abs/2605.13986), which scales tabular foundation models to datasets with up to one million training rows while substantially accelerating training and inference.

Previously, I was a Senior AI Researcher in [Aleph Alpha Research](https://aleph-alpha.com/research/)'s Foundation Models team, working on efficient LLM pretraining, [tokenizer-free architectures](https://arxiv.org/abs/2603.15953), and large-scale optimization. Before that, I was a Senior Expert at the [Bosch Center for Artificial Intelligence](https://www.bosch-ai.com/), where my research centered on robust and reliable computer vision, neural architecture search, and synthetic data.

My broader interests span efficient and reliable machine learning, AutoML, and open-source software. I am an [ELLIS](https://ellis.eu/members) member, an [ELIZA Industrial Fellow](https://eliza.school/about-us/), and an Area Chair for [NeurIPS 2026](https://neurips.cc/Conferences/2026). I have also contributed to [scikit-learn](https://scikit-learn.org/stable/about.html#authors), including its probability-calibration, kernel-ridge, and Gaussian-process modules.

I live in Böblingen and work in Freiburg. Outside research, I enjoy spending time with my wife and our three children. I am always happy to connect with people working on tabular foundation models, scalable pretraining, efficient or tokenizer-free architectures, and open-source machine learning.

<div class="about-links">
  <a href="/publications/" class="btn">Publications</a>
  <a href="/cv/" class="btn">Curriculum Vitae</a>
  <a href="https://scholar.google.de/citations?user=w047VfEAAAAJ" class="btn">Google Scholar <span aria-hidden="true">↗</span></a>
  <a href="https://github.com/jmetzen" class="btn">GitHub <span aria-hidden="true">↗</span></a>
  <a href="https://huggingface.co/Prior-Labs/tabpfn_3" class="btn">TabPFN-3 <span aria-hidden="true">↗</span></a>
  <a href="https://huggingface.co/collections/Aleph-Alpha/tfree-hat-7b-pretrained" class="btn">Tokenizer-Free HAT Models <span aria-hidden="true">↗</span></a>
</div>

### Research Interests

<div class="research-interests">
<details>
<summary>Tabular Foundation Models and Scalable Pretraining</summary>
<p>I work on foundation models for structured data that learn from diverse (synthetic) datasets during pretraining and can then fit entirely new datasets in context—without fine-tuning—effectively turning model fitting into fast, direct inference. My current focus is scaling these models to substantially larger datasets, understanding their scaling behavior, and improving the efficiency of both pretraining and inference. This work includes <a href="https://arxiv.org/abs/2605.13986">TabPFN-3</a>, which extends tabular foundation models to datasets with up to one million training rows.</p>
</details>

<details>
<summary>Efficient and Tokenizer-Free Architectures</summary>
<p>I am interested in architectures that make large-scale pretraining and inference more efficient. At Aleph Alpha Research, I worked on tokenizer-free language models, domain adaptation, and large-scale optimization. Our <a href="https://arxiv.org/abs/2603.15953">Hierarchical Autoregressive Transformer (HAT)</a> uses a hierarchical architecture in which the encoder and decoder operate on bytes, while the backbone operates on regex-defined words; we scaled this approach to models with up to 70 billion parameters. Building on HAT, <a href="https://arxiv.org/abs/2601.22805">SOMBRERO</a> learns the sequence aggregation end to end instead of relying on predefined word boundaries.</p>
</details>

<details>
<summary>Reliable and Robust Machine Learning</summary>
<p>My work on reliable computer vision studied both how models fail and how to make them safer. We used generative models to uncover <a href="https://arxiv.org/abs/2303.05072">systematic errors of image classifiers on rare subgroups</a> and <a href="https://arxiv.org/abs/2309.13489">systematic errors of object detectors</a>, and identified <a href="https://openaccess.thecvf.com/content/CVPR2022/papers/Lovisotto_Give_Me_Your_Attention_Dot-Product_Attention_Considered_Harmful_for_Adversarial_CVPR_2022_paper.pdf">vulnerabilities of Transformer-based networks to adversarial patch and token attacks</a>.</p>
<p>We developed architectures that are certifiably robust against patch attacks for <a href="https://openreview.net/forum?id=hr-3PMvDpil">image classification</a> and <a href="https://openreview.net/forum?id=b0JxQC7JLWh">semantic segmentation</a>, as well as adversarial-training methods for <a href="https://openaccess.thecvf.com/content_ICCV_2019/papers/Mummadi_Defending_Against_Universal_Perturbations_With_Shared_Adversarial_Training_ICCV_2019_paper.pdf">universal perturbations</a> and <a href="https://arxiv.org/abs/2101.11453">universal adversarial patches</a>. I also worked on <a href="https://arxiv.org/abs/2106.14999">test-time adaptation under domain shift</a> and studied how <a href="https://openreview.net/forum?id=yUxUNaj2Sl">shape-biased representations affect robustness to common image corruptions</a>.</p>
</details>

<details>
<summary>AutoML and Neural Architecture Search</summary>
<p>The vast design space of neural networks and the diversity of inference hardware make manual architecture design difficult to scale. Hardware-aware neural architecture search can automate this process, improving design efficiency and reducing the cost of AI development. For an overview, see our survey on <a href="https://jmlr.org/papers/v20/18-598.html">Neural Architecture Search</a> and our survey on <a href="https://arxiv.org/abs/2202.07242">Neural Architecture Search for Dense Prediction Tasks in Computer Vision</a>.</p>
<p>My work in this area also includes <a href="https://arxiv.org/abs/1711.04528">efficient architecture search through network morphisms</a>, <a href="https://arxiv.org/abs/1804.09081">multi-objective NAS via Lamarckian evolution</a>, and <a href="https://arxiv.org/abs/1911.11090">meta-learning neural architectures for few-shot learning</a>. We also collected practical lessons for making search more effective in our <a href="https://arxiv.org/abs/2107.03719">Bag of Tricks for Neural Architecture Search</a>.</p>
<p>I also co-developed <a href="https://arxiv.org/abs/2309.16414">AutoCLIP</a>, which automatically tunes zero-shot classifiers for vision-language models and improves performance across a broad range of domains.</p>
</details>

</div>
