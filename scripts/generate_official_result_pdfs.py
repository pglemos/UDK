from __future__ import annotations

import argparse
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


RESULTS = (
    (
        "insanos",
        "Resultado oficial UDK 2026 - 1a etapa - Ultra Insanos",
        "udk-2026-1a-etapa-ultra-insanos.pdf",
    ),
    (
        "rapidos",
        "Resultado oficial UDK 2026 - 1a etapa - Ultras Rapidos",
        "udk-2026-1a-etapa-ultras-rapidos.pdf",
    ),
)


def render_images_as_pdf(sources: tuple[Path, Path], destination: Path, title: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = A4
    document = canvas.Canvas(str(destination), pagesize=A4, pageCompression=1)
    document.setTitle(title)
    document.setAuthor("Ultras do Kart")
    for source in sources:
        document.drawImage(
            ImageReader(str(source)),
            0,
            0,
            width=page_width,
            height=page_height,
            preserveAspectRatio=False,
            mask="auto",
        )
        document.showPage()
    document.save()


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera os PDFs oficiais da 1a etapa UDK.")
    parser.add_argument("--insanos-resultado", type=Path, required=True)
    parser.add_argument("--insanos-tomada", type=Path, required=True)
    parser.add_argument("--rapidos-resultado", type=Path, required=True)
    parser.add_argument("--rapidos-tomada", type=Path, required=True)
    parser.add_argument("--public-dir", type=Path, default=Path("apps/plataforma/public/resultados"))
    parser.add_argument("--output-dir", type=Path, default=Path("output/pdf"))
    args = parser.parse_args()

    sources = {
        "insanos": (args.insanos_resultado, args.insanos_tomada),
        "rapidos": (args.rapidos_resultado, args.rapidos_tomada),
    }
    for category, title, filename in RESULTS:
        category_sources = sources[category]
        for source in category_sources:
            if not source.is_file():
                raise FileNotFoundError(source)
        for directory in (args.public_dir, args.output_dir):
            render_images_as_pdf(category_sources, directory / filename, title)


if __name__ == "__main__":
    main()
