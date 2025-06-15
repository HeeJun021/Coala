import React, { useEffect, useState } from "react";
import "../../styles/A4EditorLayout.css";

const PAGE_HEIGHT_PX = 1122;

const TiptapEditorPreview = ({ html }) => {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (!html) return;

    const virtualDiv = document.createElement("div");
    virtualDiv.innerHTML = html;
    virtualDiv.style.position = "absolute";
    virtualDiv.style.visibility = "hidden";
    virtualDiv.style.width = "794px";
    virtualDiv.style.padding = "40px";
    virtualDiv.style.boxSizing = "border-box";
    document.body.appendChild(virtualDiv);

    const children = Array.from(virtualDiv.children);
    let currentPage = [];
    let currentHeight = 0;
    const splitPages = [];

    children.forEach((child) => {
      const clone = child.cloneNode(true);
      virtualDiv.appendChild(clone);
      const height = clone.offsetHeight;

      if (currentHeight + height > PAGE_HEIGHT_PX) {
        splitPages.push([...currentPage]);
        currentPage = [child.outerHTML];
        currentHeight = height;
      } else {
        currentPage.push(child.outerHTML);
        currentHeight += height;
      }

      virtualDiv.removeChild(clone);
    });

    if (currentPage.length > 0) {
      splitPages.push(currentPage);
    }

    document.body.removeChild(virtualDiv);
    setPages(splitPages);
  }, [html]);

  return (
    <div className="editor-container">
      {pages.map((page, i) => (
        <div key={i} className="editor-page">
          {page.map((html, j) => (
            <div key={j} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
          <div className="text-sm text-center text-gray-400 mt-4">
            - {i + 1} 페이지 -
          </div>
        </div>
      ))}
    </div>
  );
};

export default TiptapEditorPreview;
