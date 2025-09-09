import React from 'react';

// 재귀적으로 노드를 렌더링하는 함수
const renderNode = (node, key) => {
  // 자식 노드가 있으면 먼저 렌더링
  const children = node.content?.map((childNode, index) => renderNode(childNode, `${key}-${index}`));

  switch (node.type) {
    case 'heading':
      const Tag = `h${node.attrs.level}`;
      return <Tag key={key}>{children}</Tag>;
    case 'paragraph':
      // 내용이 없으면 렌더링하지 않음 (Tiptap의 기본 빈 p태그)
      if (!children) return null;
      return <p key={key}>{children}</p>;
    case 'text':
      let element = <>{node.text}</>;
      if (node.marks) {
        node.marks.forEach(mark => {
          if (mark.type === 'bold') {
            element = <strong>{element}</strong>;
          }
        });
      }
      return element;
    case 'bulletList':
      return <ul key={key} className="list-disc pl-5">{children}</ul>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'table':
       return (
        <table key={key} className="w-full border-collapse border border-gray-300 my-2">
          <tbody>{children}</tbody>
        </table>
       );
    case 'tableRow':
      return <tr key={key}>{children}</tr>
    case 'tableHeader':
      return <th key={key} className="border p-2 bg-gray-100 text-left">{children}</th>
    case 'tableCell':
      return <td key={key} className="border p-2">{children}</td>
    case 'image':
      return <img key={key} src={node.attrs.src} alt={node.attrs.alt || 'image'} className="max-w-full h-auto rounded my-2" />
    case 'doc': // 최상위 노드
      return <>{children}</>;
    default:
      console.warn('Unknown Tiptap node type:', node.type);
      return null;
  }
};

const TiptapContentRenderer = ({ content }) => {
  if (!content || content.type !== 'doc' || !Array.isArray(content.content)) {
    return <div className="text-gray-400 text-sm">표시할 콘텐츠가 없거나 형식이 올바르지 않습니다.</div>;
  }

  // 최상위 노드가 내용 없는 p태그 하나만 있는지 체크
  if (content.content.length === 1 && content.content[0].type === 'paragraph' && !content.content[0].content) {
    return <div className="text-gray-400 text-sm">내용 없음</div>;
  }

  return (
    <div className="prose prose-sm max-w-none">
      {renderNode(content, 'root')}
    </div>
  );
};

export default TiptapContentRenderer;