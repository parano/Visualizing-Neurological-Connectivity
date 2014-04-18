##Network Flow - Visualizing Neurological Connectivity

Yang Chaoyu, Aniket Handa, Gregory Nelson, A Conrad Nied    
{chaoyu, aniket, glnelson, anied}@uw.edu

![Summary](summary.png)

Understanding dense, time-varying networks lies at the heart of long-standing challenges in scientific domains, especially biology. We construct a focused visualization tool for neurological functional connectivity data. We apply multiple filtering techniques – animation and selecting by inclusion/exclusion - to make displays less overwhelming for general and expert audiences. We also allow filtering with a bootstrapped confidence level and support 2-way interactive visual hypothesis testing, to bring the noise and complexity of the data into context. Our animation display also supports casual use and inquiry into the underlying data for a general audience.

You may download the  [Poster](https://github.com/CSE512-14W/fp-chaoyu-aniket-glnelson-anied/raw/gh-pages/final/poster-chaoyu-aniket-glnelson-anied.pdf) and 
[Final Paper](https://github.com/CSE512-14W/fp-chaoyu-aniket-glnelson-anied/raw/gh-pages/final/paper-chaoyu-aniket-glnelson-anied.pdf) for further information about this project.

## Running Instructions

Access our visualization **[here](http://parano.github.io/Visualizing-Neurological-Connectivity
)** or download this repository and run `python -m SimpleHTTPServer 9000` to access from http://localhost:9000/.

## Operation

* Click on nodes to move them
* Brush over nodes to highlight them (show activity coming from specific nodes)
* Press start to play data
* While stopped, brush on the timeline to change start time and duration
* Changes the datasets

## Division of Labor

Each member took part in writing code and designing the system. To break it down by focused contribution:

* Chaoyu: Coding lead
* Aniket: Progress report, Coding
* Greg: Literature review, deliverables
* Conrad: Dataset, Matlab coding, deliverables
