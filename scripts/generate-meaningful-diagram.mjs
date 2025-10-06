import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

async function generateMeaningfulDiagram() {
  try {
    // Load dependency data
    const depMapPath = path.join(repoRoot, 'reports', 'dependency-map.json');
    const depMap = JSON.parse(await readFile(depMapPath, 'utf8'));
    
    const { nodes, edges, violations, summary } = depMap.graph;
    
    // Create a meaningful Mermaid diagram showing actual relationships
    let mermaid = `%%{init: {"theme": "base", "themeVariables": {"fontSize": "14px", "primaryColor": "#1f2937", "primaryTextColor": "#ffffff", "primaryBorderColor": "#374151", "lineColor": "#6b7280", "secondaryColor": "#111827", "tertiaryColor": "#0f172a"}}}%%
flowchart TD
`;

    // Add nodes with meaningful information
    nodes.forEach(node => {
      const fileCount = depMap.layerStats?.find(l => l.layer === node.name)?.fileCount || 0;
      const violations = depMap.violationsByEdge?.find(v => v.edge.includes(node.name))?.count || 0;
      
      mermaid += `  ${node.name}["${node.name}<br/>📁 ${fileCount} files<br/>⚠️ ${violations} violations"]
  style ${node.name} fill:${node.color},stroke:#333,stroke-width:3px,color:#fff\n`;
    });

    mermaid += `\n`;

    // Add actual dependency relationships with weights and violation indicators
    edges.forEach(edge => {
      const violationCount = violations?.filter(v => 
        v.from === edge.from && v.to === edge.to
      ).length || 0;
      
      const edgeStyle = edge.allowed ? 
        `style ${edge.from}${edge.to} stroke:#10b981,stroke-width:2px` :
        `style ${edge.from}${edge.to} stroke:#ef4444,stroke-width:4px,stroke-dasharray: 5 5`;
      
      const label = violationCount > 0 ? 
        `${edge.weight} deps<br/>❌ ${violationCount} violations` : 
        `${edge.weight} deps`;
      
      mermaid += `  ${edge.from} -->|"${label}"| ${edge.to}\n`;
      mermaid += `  ${edgeStyle}\n\n`;
    });

    // Add architectural insights
    mermaid += `
  %% Architectural Insights
  subgraph insights ["🏗️ Architecture Insights"]
    direction TB
    insight1["📊 Total: ${summary.totalFiles} files, ${summary.totalEdges} dependencies"]
    insight2["🚨 ${summary.violationCount} architectural violations"]
    insight3["🔍 ${summary.orphanCount} orphan files"]
    insight4["⚠️ Main Issue: API layer violating BFF separation"]
  end

  %% Layer Dependencies (Clean Architecture)
  subgraph clean ["🎯 Clean Architecture Flow"]
    direction TB
    DB --> Adapters
    Adapters --> Ports
    Ports --> Services
    Services --> Policies
    Services --> PostingRules
    Policies --> Contracts
    PostingRules --> Contracts
    Contracts --> API
    API --> UI
    API --> Worker
  end

  %% Violation Hotspots
  subgraph violations ["🔥 Violation Hotspots"]
    direction TB
    API -.->|"300 violations"| BFF
    note1["❌ API routes importing BFF lib files<br/>Breaks clean architecture"]
  end
`;

    // Write the meaningful Mermaid diagram
    const outputPath = path.join(repoRoot, 'reports', 'dependency-map-meaningful.mmd');
    await writeFile(outputPath, mermaid);
    
    console.log(`✅ Generated meaningful dependency diagram → ${outputPath}`);
    console.log(`📊 Architecture insights:`);
    console.log(`   • ${summary.totalFiles} files across ${nodes.length} layers`);
    console.log(`   • ${summary.violationCount} architectural violations`);
    console.log(`   • Main issue: API layer violating BFF separation (${summary.violationCount} violations)`);
    console.log(`   • ${summary.orphanCount} orphan files need attention`);
    
  } catch (error) {
    console.error('❌ Error generating meaningful diagram:', error);
    process.exit(1);
  }
}

generateMeaningfulDiagram();
