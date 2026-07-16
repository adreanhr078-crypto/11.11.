import fitz
import os

mkdir = lambda p: os.makedirs(p, exist_ok=True)
mkdir(".agents/outputs")

doc = fitz.open("attached_assets/11_11_project_images_1784230528911.pdf")
print(f"Pages: {doc.page_count}")

for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    out = f".agents/outputs/page_{i+1}.png"
    pix.save(out)
    print(f"Saved {out} ({page.rect.width:.0f}x{page.rect.height:.0f}pt)")

doc.close()
print("Done.")
