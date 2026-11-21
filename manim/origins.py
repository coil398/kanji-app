"""Manim scenes driven by one JSON record per kanji."""
import json
from pathlib import Path

from manim import *

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "kanji"
config.pixel_width = 720
config.pixel_height = 720
config.frame_width = 8
config.frame_height = 8
config.frame_rate = 24


def source_drawing(char: str, picture: str):
    if not picture.strip():
        raise ValueError(f"Missing drawing description for {char}")
    ink = "#31564A"
    if char == "日" and "sun" in picture:
        return VGroup(Circle(radius=0.9, color=ink), Line(LEFT * 0.75, RIGHT * 0.75, color=ink))
    if char == "月" and "moon" in picture:
        return VGroup(Arc(radius=1, start_angle=-PI / 2, angle=PI, color=ink), Line(LEFT * 0.48 + UP * .9, LEFT * .48 + DOWN * .9, color=ink))
    if char == "山" and "mountain" in picture:
        return VGroup(*[Polyline(LEFT * x + DOWN * .8, LEFT * x + UP * y, LEFT * (x - .3) + DOWN * .8, color=ink) for x, y in [(-.65, .4), (0, .9), (.65, .45)]])
    if char in {"川", "水"} and "water" in picture:
        return VGroup(*[ParametricFunction(lambda t, x=x: RIGHT * x + UP * (t - .5) + RIGHT * .18 * np.sin(t * TAU), t_range=[0, 1], color=ink) for x in [-.55, 0, .55]])
    if char in {"木", "本"} and "tree" in picture:
        return VGroup(Line(DOWN * .9, UP * .8, color=ink), Line(LEFT * .7, RIGHT * .7, color=ink), Line(DOWN * .1, LEFT * .65 + UP * .5, color=ink), Line(DOWN * .1, RIGHT * .65 + UP * .5, color=ink), Line(DOWN * .1, LEFT * .6 + DOWN * .7, color=ink), Line(DOWN * .1, RIGHT * .6 + DOWN * .7, color=ink))
    if char in {"上", "下"} and "baseline" in picture:
        y = .48 if char == "上" else -.48
        return VGroup(Line(LEFT * .8 + DOWN * .35, RIGHT * .8 + DOWN * .35, color=ink), Line(LEFT * .42 + y * UP, LEFT * .42 + y * UP + RIGHT * .84, color=ink))
    if char in {"一", "二", "三"}:
        count = {"一": 1, "二": 2, "三": 3}[char]
        return VGroup(*[Line(LEFT * .8 + UP * (.4 - i * .4), RIGHT * .8 + UP * (.4 - i * .4), color=ink) for i in range(count)])
    if char == "雨":
        return VGroup(Arc(radius=.8, start_angle=PI * .12, angle=PI * .76, color=ink).shift(UP * .35), *[Line(DOWN * .05 + LEFT * x, DOWN * .75 + LEFT * x, color=ink) for x in [-.5, 0, .5]])
    if char == "九" and "elbow" in picture:
        elbow = VMobject(color=ink).set_points_as_corners([LEFT * .45 + UP * .8, LEFT * .45 + DOWN * .2, LEFT * .1 + DOWN * .5, RIGHT * .55 + DOWN * .2])
        return VGroup(elbow)
    if char == "車":
        return VGroup(Square(side_length=1.25, color=ink), Line(UP * .75, DOWN * .75, color=ink), Line(LEFT * .8, RIGHT * .8, color=ink), *[Circle(radius=.12, color=ink).shift(RIGHT * x + DOWN * y) for x in [-.65, .65] for y in [-.55, .55]])
    if char == "人" or char == "女" or char == "子":
        return VGroup(Circle(radius=.2, color=ink).shift(UP * .65), Line(UP * .42, DOWN * .25, color=ink), Line(UP * .18, LEFT * .6, color=ink), Line(UP * .18, RIGHT * .6, color=ink), Line(DOWN * .25, LEFT * .55 + DOWN * .8, color=ink), Line(DOWN * .25, RIGHT * .55 + DOWN * .8, color=ink))
    if char == "火":
        return VGroup(*[Polyline(DOWN * .7 + LEFT * x, UP * .05 + LEFT * x, UP * .75 + LEFT * (x + .25), UP * .35 + LEFT * (x + .05), color=ink) for x in [-.45, .3]])
    return VGroup(Line(LEFT * .65 + DOWN * .6, RIGHT * .65 + DOWN * .6, color=ink), Line(LEFT * .2 + DOWN * .6, RIGHT * .2 + UP * .6, color=ink))


class OriginScene(Scene):
    kanji_char = "日"

    def construct(self):
        record = json.loads((DATA / f"{self.kanji_char}.json").read_text(encoding="utf-8"))
        drawing = source_drawing(self.kanji_char, record["animation"]["manim"]["picture"]).set_stroke(width=7).scale(1.2)
        glyph = Text(self.kanji_char, font="Noto Serif CJK JP", font_size=190, color="#1E2927")
        caption = Text(record["meanings"][0], font_size=34, color="#62716B").next_to(glyph, DOWN, buff=.35)
        self.play(Create(drawing), run_time=1.1)
        self.wait(.35)
        self.play(Transform(drawing, glyph), FadeIn(caption), run_time=1.1)
        self.wait(.8)


for _path in sorted(DATA.glob("*.json")):
    if _path.name == "index.json":
        continue
    _char = _path.stem
    globals()[f"Origin{ord(_char):X}"] = type(f"Origin{ord(_char):X}", (OriginScene,), {"kanji_char": _char})
