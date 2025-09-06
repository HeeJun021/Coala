import React, { useEffect, useState, useCallback } from "react";
import TemplateCard from "./TemplateCard";
import SelectTemplateModal from "./SelectTemplateModal";
import AlertModal from "../AlertModal";
import { Plus } from "lucide-react";
import {
  getTemplates,
  addTemplate,
  deleteTemplate,
} from "../../api/templateApi";

const TemplatesListPanel = ({ project }) => {
  const projectId = project?.project_id;
  const [templates, setTemplates] = useState([]);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [deleteTargetTemplateId, setDeleteTargetTemplateId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!projectId) return;
    try {
      const result = await getTemplates(projectId);
      setTemplates(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("템플릿 목록 불러오기 실패", err);
      setTemplates([]);
    }
  }, [projectId]);

  const handleAddTemplate = async (selectedTemplate) => {
    try {
      await addTemplate(projectId, selectedTemplate);
      await fetchTemplates();
    } catch (err) {
      console.error("템플릿 추가 실패", err);
      alert("템플릿 추가에 실패했습니다.");
    }
  };

  const confirmDelete = (templateId) => {
    setDeleteTargetTemplateId(templateId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteTemplate(projectId, deleteTargetTemplateId);
      await fetchTemplates();
    } catch (err) {
      console.error("템플릿 삭제 실패", err);
      alert("삭제에 실패했습니다.");
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetTemplateId(null);
    }
  };

  // PATCH 응답을 목록 상태에 반영
  const handleTemplateUpdated = (updated) => {
    setTemplates((prev) =>
      prev.map((t) => (t.template_id === updated.template_id ? updated : t))
    );
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <>
      <div className="p-6 flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {templates.length > 0 ? (
            templates.map((template) => (
              <TemplateCard
                key={template.template_id}
                projectId={projectId}
                template={template}
                onDelete={() => confirmDelete(template.template_id)}
                onUpdated={handleTemplateUpdated}
              />
            ))
          ) : (
            <div className="text-gray-500 text-sm col-span-3">
              템플릿이 없습니다. 새 템플릿을 추가하세요.
            </div>
          )}

          <div
            onClick={() => setShowSelectModal(true)}
            className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">템플릿 추가</span>
          </div>
        </div>
      </div>

      {showSelectModal && (
        <SelectTemplateModal
          onClose={() => setShowSelectModal(false)}
          onSelect={handleAddTemplate}
        />
      )}

      <AlertModal
        isOpen={showDeleteModal}
        isConfirm
        message="정말 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteTargetTemplateId(null);
        }}
      />
    </>
  );
};

export default TemplatesListPanel;
