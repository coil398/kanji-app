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
    if char in {"木", "本"}:
        tree = VGroup(Line(DOWN * .65, UP * .65), Line(LEFT * .67, RIGHT * .67), Line(LEFT * .48 + UP * .12, LEFT * .76 + UP * .55), Line(RIGHT * .48 + UP * .12, RIGHT * .76 + UP * .55), Line(LEFT * .12 + DOWN * .45, LEFT * .62 + DOWN * .85), Line(RIGHT * .12 + DOWN * .45, RIGHT * .62 + DOWN * .85))
        if char == "本": tree.add(Line(LEFT * .38 + DOWN * .32, RIGHT * .38 + DOWN * .32))
        return tree.set_color(ink)
    if char == "日":
        return VGroup(RoundedRectangle(width=1.45, height=1.65, corner_radius=.12), Line(LEFT * .57, RIGHT * .57)).set_color(ink)
    if char == "月":
        outer = Arc(radius=.86, start_angle=PI / 2, angle=PI)
        inner = Arc(radius=.62, start_angle=PI / 2, angle=PI).shift(RIGHT * .34)
        tips = VGroup(Line(UP * .86, RIGHT * .34 + UP * .62), Line(DOWN * .86, RIGHT * .34 + DOWN * .62))
        return VGroup(outer, inner, tips).set_color(ink)
    if char == "山":
        return VGroup(VMobject().set_points_as_corners([LEFT * .85 + DOWN * .65, LEFT * .85 + UP * .15, LEFT * .53 + DOWN * .2, ORIGIN, LEFT * .25 + DOWN * .2, UP * .82, RIGHT * .24 + DOWN * .2, RIGHT * .55 + UP * .12, RIGHT * .85 + DOWN * .2, RIGHT * .85 + UP * .15, RIGHT * .85 + DOWN * .65])).set_color(ink)
    if char == "川":
        lines = [ParametricFunction(lambda t, x=x, sign=sign: RIGHT * x + UP * (1.2 - 2.4 * t) + RIGHT * .13 * np.sin(t * TAU) * sign, t_range=[0, 1]) for x, sign in [(-.5, 1), (0, -1), (.5, 1)]]
        return VGroup(*lines).set_color(ink)
    if char == "雨":
        cloud = VMobject().set_points_smoothly([LEFT * .78 + DOWN * .05, LEFT * .82 + UP * .18, LEFT * .66 + UP * .37, LEFT * .38 + UP * .4, LEFT * .2 + UP * .68, RIGHT * .16 + UP * .7, RIGHT * .46 + UP * .48, RIGHT * .72 + UP * .42, RIGHT * .82 + UP * .22, RIGHT * .72 + DOWN * .06, ORIGIN + DOWN * .08])
        drops = VGroup(*[Line(LEFT * x + DOWN * .5, LEFT * x + DOWN * .9) for x in [-.45, 0, .45]])
        return VGroup(cloud, drops).set_color(ink)
    if char == "人":
        torso = VMobject().set_points_as_corners([UP * .8, UP * .08, DOWN * .35, LEFT * .55 + DOWN * .8])
        arm = VMobject().set_points_as_corners([UP * .08, RIGHT * .45 + UP * .33, RIGHT * .82 + UP * .06])
        leg = Line(DOWN * .35, RIGHT * .5 + DOWN * .8)
        return VGroup(torso, arm, leg).set_color(ink)
    if char == "子":
        head = Circle(radius=.48).shift(UP * .38)
        arms = Line(LEFT * .8 + UP * .02, RIGHT * .8 + UP * .02)
        wrap = Arc(radius=.62, start_angle=PI, angle=PI).shift(DOWN * .12)
        legs = VGroup(Line(LEFT * .5 + DOWN * .55, DOWN * .95), Line(RIGHT * .5 + DOWN * .55, DOWN * .95))
        return VGroup(head, arms, wrap, legs).set_color(ink)
    if char == "車":
        carriage = RoundedRectangle(width=1.3, height=.75, corner_radius=.08).shift(UP * .18)
        wheels = VGroup(Circle(radius=.27).shift(LEFT * .95), Circle(radius=.27).shift(RIGHT * .95))
        axle = Line(LEFT * .95, RIGHT * .95)
        shaft = Line(DOWN * .2, DOWN * .95)
        return VGroup(carriage, wheels, axle, shaft).set_color(ink)
    if char == "土":
        mound = VMobject().set_points_smoothly([LEFT * .8 + DOWN * .38, LEFT * .65 + DOWN * .05, LEFT * .3 + UP * .15, ORIGIN + UP * .45, RIGHT * .3 + UP * .15, RIGHT * .65 + DOWN * .05, RIGHT * .8 + DOWN * .38])
        return VGroup(mound, Line(LEFT * .9 + DOWN * .4, RIGHT * .9 + DOWN * .4)).set_color(ink)
    if char == "火":
        left = VMobject().set_points_as_corners([LEFT * .7 + DOWN * .65, LEFT * .52 + DOWN * .05, LEFT * .65 + UP * .35, LEFT * .15 + DOWN * .02, ORIGIN + UP * .8, RIGHT * .18 + UP * .1])
        right = VMobject().set_points_as_corners([RIGHT * .65 + DOWN * .65, RIGHT * .46 + DOWN * .02, RIGHT * .63 + UP * .36, RIGHT * .13 + DOWN * .1, ORIGIN + UP * .55])
        return VGroup(left, right).set_color(ink)
    if char == "水":
        stream = ParametricFunction(lambda t: UP * (1.15 - 2.3 * t) + RIGHT * .23 * np.sin(t * TAU), t_range=[0, 1])
        banks = VGroup(ParametricFunction(lambda t: LEFT * .43 + UP * (1.0 - 2.0 * t) - RIGHT * .12 * np.sin(t * TAU), t_range=[0, 1]), ParametricFunction(lambda t: RIGHT * .43 + UP * (1.0 - 2.0 * t) + RIGHT * .12 * np.sin(t * TAU), t_range=[0, 1]))
        return VGroup(stream, banks).set_color(ink)
    raise ValueError(f"No Manim origin drawing is defined for {char}: {picture}")


class OriginScene(Scene):
    kanji_char = "日"

    def construct(self):
        self.camera.background_color = "#F6F3EB"
        record = json.loads((DATA / f"{self.kanji_char}.json").read_text(encoding="utf-8"))
        drawing = source_drawing(self.kanji_char, record["animation"]["manim"]["picture"]).set_stroke(width=7).scale(1.22)
        glyph = Text(self.kanji_char, font="Noto Serif CJK JP", font_size=200, color="#1E2927")
        caption = Text(record["meanings"][0], font_size=31, color="#62716B").move_to(DOWN * 2.7)
        source = Text("Wiktionary · Shuowen", font_size=16, color="#718079").move_to(DOWN * 3.65)
        self.play(Create(drawing), run_time=1.0)
        self.wait(.3)
        self.play(Transform(drawing, glyph), FadeIn(caption), run_time=1.0)
        self.play(FadeIn(source), run_time=.25)
        self.wait(.8)


for _path in sorted(DATA.glob("*.json")):
    if _path.name == "index.json":
        continue
    _char = _path.stem
    globals()[f"Origin{ord(_char):X}"] = type(f"Origin{ord(_char):X}", (OriginScene,), {"kanji_char": _char})
