import React, { useState } from "react";
import DocsListPanel from "./DocsListPanel";
import DocEditorPanel from "./DocEditorPanel";

const DocumentWrapperPage = ({ projectId }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);

  return (
    <div className="p-6">
      {selectedDocId === null ? (
        <DocsListPanel
          projectId={projectId}
          onSelect={(docId) => setSelectedDocId(docId)}
        />
      ) : (
        <DocEditorPanel
          projectId={projectId}
          docId={selectedDocId}
          onBack={() => setSelectedDocId(null)}
        />
      )}
    </div>
  );
};

// ✅ ✅ ✅ 반드시 default export로 내보내기
export default DocumentWrapperPage;
