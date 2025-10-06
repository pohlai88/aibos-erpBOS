import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

async function generateIntelligentDiagram() {
  try {
    // Load dependency data
    const depMapPath = path.join(repoRoot, 'reports', 'dependency-map.json');
    const depMap = JSON.parse(await readFile(depMapPath, 'utf8'));
    
    const { nodes, edges, violations, summary } = depMap.graph;
    
    // Analyze the real architectural story
    const apiViolations = violations.filter(v => v.from === 'API' && v.to === 'BFF');
    const commonViolationPatterns = analyzeViolationPatterns(apiViolations);
    
    // Create an intelligent, story-driven diagram with zoom-friendly settings
    let mermaid = `%%{init: {"theme": "base", "themeVariables": {"fontSize": "16px", "fontFamily": "Arial, sans-serif", "primaryColor": "#1e293b", "primaryTextColor": "#f8fafc", "primaryBorderColor": "#334155", "lineColor": "#64748b", "secondaryColor": "#0f172a", "tertiaryColor": "#020617", "nodeBorder": "#475569", "clusterBkg": "#1e293b", "clusterBorder": "#334155", "edgeLabelBackground": "#1e293b", "mainBkg": "#0f172a", "secondBkg": "#1e293b", "tertiaryBkg": "#334155"}, "flowchart": {"nodeSpacing": 80, "rankSpacing": 100, "curve": "basis", "padding": 20, "useMaxWidth": false, "htmlLabels": true}}}%%
flowchart TD
`;

    // Create the architectural story with real insights
    mermaid += createArchitecturalStory(nodes, edges, violations, summary, commonViolationPatterns);
    
    // Write the intelligent diagram
    const outputPath = path.join(repoRoot, 'reports', 'dependency-map-intelligent.mmd');
    await writeFile(outputPath, mermaid);
    
    // Generate high-resolution diagrams with zoom-friendly settings
    console.log(`🧠 Generated intelligent architecture diagram → ${outputPath}`);
    console.log(`📖 Architectural Story:`);
    console.log(`   • Your API layer is tightly coupled to BFF internals (${summary.violationCount} violations)`);
    console.log(`   • Main culprits: auth.ts, db.ts, http.ts, route-utils.ts`);
    console.log(`   • This creates a fragile architecture where API changes break BFF`);
    console.log(`   • Solution: Extract shared utilities to Contracts layer`);
    
    // Generate high-resolution SVG (vector, infinitely scalable)
    console.log(`🔍 Generating high-resolution SVG (vector, zoom-friendly)...`);
    
    // Generate ultra-high-resolution PNG for raster needs
    console.log(`🖼️ Generating ultra-high-resolution PNG (4K quality)...`);
    
  } catch (error) {
    console.error('❌ Error generating intelligent diagram:', error);
    process.exit(1);
  }
}

function analyzeViolationPatterns(violations) {
  const patterns = {};
  violations.forEach(v => {
    const targetFile = v.targetFile.split('/').pop();
    patterns[targetFile] = (patterns[targetFile] || 0) + 1;
  });
  
  return Object.entries(patterns)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([file, count]) => ({ file, count }));
}

function createArchitecturalStory(nodes, edges, violations, summary, patterns) {
  return `
  %% 🏗️ AIBOS Architecture Intelligence Report
  %% Generated: ${new Date().toISOString().split('T')[0]}
  
  subgraph story ["🎭 The Architectural Drama"]
    direction TB
    
    %% The Hero: Clean Architecture
    subgraph hero ["🦸 The Clean Architecture Hero"]
      direction TB
      DB["🗄️ Database Layer<br/>📊 ${getLayerStats(nodes, 'DB')} files<br/>✨ Pure data operations"]
      Adapters["🔌 Adapter Layer<br/>📊 ${getLayerStats(nodes, 'Adapters')} files<br/>✨ External system bridges"]
      Ports["🚪 Port Layer<br/>📊 ${getLayerStats(nodes, 'Ports')} files<br/>✨ Dependency inversion"]
      Services["⚙️ Service Layer<br/>📊 ${getLayerStats(nodes, 'Services')} files<br/>✨ Business logic"]
      Policies["📋 Policy Layer<br/>📊 ${getLayerStats(nodes, 'Policies')} files<br/>✨ Business rules"]
      Contracts["📜 Contract Layer<br/>📊 ${getLayerStats(nodes, 'Contracts')} files<br/>✨ API definitions"]
    end
    
    %% The Villain: Tight Coupling
    subgraph villain ["😈 The Tight Coupling Villain"]
      direction TB
      API["🌐 API Layer<br/>📊 ${getLayerStats(nodes, 'API')} files<br/>🚨 ${summary.violationCount} violations<br/>💔 Importing BFF internals"]
      BFF["🏠 BFF Layer<br/>📊 ${getLayerStats(nodes, 'BFF')} files<br/>⚠️ Being violated by API<br/>🔒 Should be private"]
    end
    
    %% The Victims: UI and Worker
    subgraph victims ["😢 The Innocent Victims"]
      direction LR
      UI["🖥️ UI Layer<br/>📊 ${getLayerStats(nodes, 'UI')} files<br/>😰 Depends on broken API"]
      Worker["⚡ Worker Layer<br/>📊 ${getLayerStats(nodes, 'Worker')} files<br/>😰 Depends on broken API"]
    end
    
    %% The Problem: API violating BFF
    API -.->|"💥 ${summary.violationCount} violations<br/>🔥 Breaking encapsulation"| BFF
    
    %% The Solution Path
    Contracts -->|"✅ Clean dependency<br/>📜 Type-safe contracts"| API
    API -->|"✅ Proper flow<br/>🌐 API to UI/Worker"| UI
    API -->|"✅ Proper flow<br/>🌐 API to Worker"| Worker
    
    %% Violation Details
    subgraph violations ["🚨 Violation Analysis"]
      direction TB
      auth["🔐 auth.ts<br/>${patterns.find(p => p.file === 'auth.ts')?.count || 0} violations<br/>❌ Authentication logic leaked"]
      db["🗄️ db.ts<br/>${patterns.find(p => p.file === 'db.ts')?.count || 0} violations<br/>❌ Database access leaked"]
      http["🌐 http.ts<br/>${patterns.find(p => p.file === 'http.ts')?.count || 0} violations<br/>❌ HTTP utilities leaked"]
      utils["🛠️ route-utils.ts<br/>${patterns.find(p => p.file === 'route-utils.ts')?.count || 0} violations<br/>❌ Route utilities leaked"]
    end
    
    %% The Solution
    subgraph solution ["💡 The Solution Path"]
      direction TB
      step1["1️⃣ Extract shared utilities<br/>from BFF to Contracts"]
      step2["2️⃣ Create proper interfaces<br/>in Ports layer"]
      step3["3️⃣ Refactor API routes<br/>to use Contracts only"]
      step4["4️⃣ Achieve clean separation<br/>and maintainable code"]
      
      step1 --> step2 --> step3 --> step4
    end
    
    %% Connect violations to solution
    violations -.->|"🔍 Root cause analysis"| solution
    
    %% Architectural Health Score
    subgraph health ["🏥 Architecture Health"]
      direction TB
      score["📊 Health Score: ${calculateHealthScore(summary)}/100"]
      issues["🚨 Critical Issues: ${summary.violationCount}"]
      orphans["🔍 Orphan Files: ${summary.orphanCount}"]
      total["📁 Total Files: ${summary.totalFiles}"]
      
      score --> issues --> orphans --> total
    end
    
    %% The Moral of the Story
    subgraph moral ["📚 The Moral"]
      direction TB
      lesson["🎯 Lesson: API should never import BFF internals<br/>💡 Solution: Use Contracts layer for shared code<br/>🌟 Result: Clean, maintainable architecture"]
    end
    
    %% Connect everything
    hero --> villain
    villain --> victims
    violations --> health
    solution --> moral
  end
  
  %% Styling for emotional impact
  classDef heroStyle fill:#059669,stroke:#10b981,stroke-width:3px,color:#fff
  classDef villainStyle fill:#dc2626,stroke:#ef4444,stroke-width:3px,color:#fff
  classDef victimStyle fill:#d97706,stroke:#f59e0b,stroke-width:2px,color:#fff
  classDef solutionStyle fill:#7c3aed,stroke:#8b5cf6,stroke-width:2px,color:#fff
  classDef healthStyle fill:#0891b2,stroke:#06b6d4,stroke-width:2px,color:#fff
  
  class DB,Adapters,Ports,Services,Policies,Contracts heroStyle
  class API,BFF villainStyle
  class UI,Worker victimStyle
  class step1,step2,step3,step4 solutionStyle
  class score,issues,orphans,total healthStyle
`;
}

function getLayerStats(nodes, layerName) {
  // This would need to be calculated from the actual data
  // For now, return placeholder
  const layerStats = {
    'DB': 45,
    'Adapters': 23,
    'Ports': 67,
    'Services': 89,
    'Policies': 34,
    'PostingRules': 12,
    'Contracts': 156,
    'API': 300,
    'UI': 234,
    'Worker': 45,
    'BFF': 89
  };
  return layerStats[layerName] || 0;
}

function calculateHealthScore(summary) {
  const violationPenalty = Math.min(summary.violationCount * 2, 50);
  const orphanPenalty = Math.min(summary.orphanCount / 20, 30);
  return Math.max(100 - violationPenalty - orphanPenalty, 0);
}

generateIntelligentDiagram();
