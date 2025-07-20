'use client'; // Add this line at the very top

import React from 'react';
import { marked } from 'marked'; // Import marked

const MarkdownPage = () => {
  const md = `我是OWON仔，是利利普OWON ADS系列示波器的专业AI助手。我的主要功能包括：

1. **产品介绍**：我可以根据您的需求，提供ADS系列示波器的详细功能和特点介绍。如果您需要了解不同型号之间的差异和适用场景，我也可以通过@memory@中的知识库为您解释<ref>[1]</ref>。

2. **使用指导**：我可以指导您如何正确设置和使用ADS系列示波器。如果您需要详细的步骤说明和操作指南，以确保您能够顺利进行测量和分析，我也可以为您提供帮助<ref>[1]</ref>。

3. **故障排查**：如果您在使用过程中遇到问题，我可以帮助您诊断和解决这些问题。根据您描述的症状，我会提供可能的原因和解决方案。如果需要进一步的技术支持或维修服务，我会建议您联系官方客服<ref>[1]</ref>。

4. **数据分析**：我可以解释示波器采集的数据，并提供数据分析方法和技巧。如果您需要理解波形图和其他测量结果，以便更好地进行故障诊断和性能评估，我也可以为您提供帮助<ref>[2]</ref>。

如果您有任何问题或需要进一步的帮助，请随时告诉我！`;

  // Use marked to parse the Markdown string
  const htmlContent = marked(md);

  return (
    <div>
      <h1>Markdown 内容页面</h1>
      {/* Use dangerouslySetInnerHTML to render the parsed HTML */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      {/* The <style jsx global> block is causing the error because styled-jsx
        needs to run on the client. By adding 'use client' above, this will now work.
      */}
      <style jsx global>{`
        /* Simple global styles for better Markdown rendering */
        body {
          font-family: sans-serif;
          line-height: 1.6;
          margin: 20px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        h1, h2, h3, h4, h5, h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        ul, ol {
          margin-left: 20px;
        }
        p {
          margin-bottom: 1em;
        }
        strong {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default MarkdownPage;