import React, { useEffect, useState} from "react";
import { Plus } from "lucide-react";
import { getTemplateCatalog } from "../../api/templateApi";

const SelectTemplateModal = ({ onClose, onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setLoading] = useState(true);

  
  useEffect(() => {
    (async () => {
      try {
        const items = await getTemplateCatalog(); // GET /template-library?published=1
        setTemplates(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = (tpl) => {
    onSelect({ catalogId: tpl.id, title: tpl.title, description: tpl.description });
     onClose();
   };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto shadow-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={18} className="text-green-600" />
          템플릿 선택
        </h2>

        {isLoading ? (
          <p className="text-gray-500">템플릿 로딩 중...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.key}
                onClick={() => handleSelect(template)}
                className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition flex flex-col"
              >
                {template.previewUrl && (
                  <img
                    src={template.previewUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <h3 className="font-medium text-gray-800">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectTemplateModal;
