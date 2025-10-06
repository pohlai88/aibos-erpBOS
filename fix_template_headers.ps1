# Fix template headers for M71+ modules
$modules = @(
    @{File = "M74-DOCUMENT-MANAGEMENT.md"; Name = "Document Management"; Priority = "🔥 HIGH"; Phase = "Phase 15 - User Experience"; Effort = "4 days"; Status = "🔄 HYBRID - Enhance M56-DOCUMENT-MANAGEMENT" },
    @{File = "M75-CONTRACT-MANAGEMENT.md"; Name = "Contract Management"; Priority = "🔶 MEDIUM"; Phase = "Phase 15 - User Experience"; Effort = "4 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M77-ASSET-MAINTENANCE.md"; Name = "Asset Maintenance"; Priority = "🔶 MEDIUM"; Phase = "Phase 15 - User Experience"; Effort = "3 days"; Status = "🔄 HYBRID - Enhance M58-ASSET-MAINTENANCE" },
    @{File = "M78-QUALITY-MANAGEMENT.md"; Name = "Quality Management"; Priority = "🔶 MEDIUM"; Phase = "Phase 15 - User Experience"; Effort = "4 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M79-COMPLIANCE-REPORTING.md"; Name = "Compliance Reporting"; Priority = "🔥 HIGH"; Phase = "Phase 15 - User Experience"; Effort = "3 days"; Status = "🔄 HYBRID - Enhance M60-COMPLIANCE-REPORTING" },
    @{File = "M81-CUSTOMER-RELATIONSHIP-MANAGEMENT.md"; Name = "Customer Relationship Management"; Priority = "🔥 HIGH"; Phase = "Phase 16 - Infrastructure Modernization"; Effort = "4 days"; Status = "🔄 HYBRID - Enhance M61-CUSTOMER-RELATIONSHIP-MANAGEMENT" },
    @{File = "M84-SUPPLY-CHAIN-MANAGEMENT.md"; Name = "Supply Chain Management"; Priority = "🔶 MEDIUM"; Phase = "Phase 16 - Infrastructure Modernization"; Effort = "5 days"; Status = "🔄 HYBRID - Enhance M62-SUPPLY-CHAIN-MANAGEMENT" },
    @{File = "M86-MANUFACTURING-EXECUTION-SYSTEM.md"; Name = "Manufacturing Execution System"; Priority = "🔶 MEDIUM"; Phase = "Phase 16 - Infrastructure Modernization"; Effort = "5 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M87-FIELD-SERVICE-MANAGEMENT.md"; Name = "Field Service Management"; Priority = "🔶 MEDIUM"; Phase = "Phase 16 - Infrastructure Modernization"; Effort = "4 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M88-SUBSCRIPTION-MANAGEMENT.md"; Name = "Subscription Management"; Priority = "🔥 HIGH"; Phase = "Phase 16 - Infrastructure Modernization"; Effort = "3 days"; Status = "🔄 HYBRID - Enhance M65-SUBSCRIPTION-MANAGEMENT" },
    @{File = "M89-MASTER-DASHBOARD.md"; Name = "Master Dashboard"; Priority = "🚨 CRITICAL"; Phase = "Phase 16 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M69-MASTER-DASHBOARD" },
    @{File = "M91-UNIVERSAL-PRINT-EXPORT-HUB.md"; Name = "Universal Print & Export Hub"; Priority = "🔥 HIGH"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "3 days"; Status = "🔄 HYBRID - Enhance M67-UNIVERSAL-PRINT-EXPORT" },
    @{File = "M92-NOTIFICATION-CENTER.md"; Name = "Notification Center"; Priority = "🔥 HIGH"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M68-NOTIFICATION-CENTER" },
    @{File = "M93-CHAT.md"; Name = "Chat"; Priority = "🔶 MEDIUM"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "3 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M94-DISASTER-RECOVERY.md"; Name = "Disaster Recovery"; Priority = "🚨 CRITICAL"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M83-DISASTER-RECOVERY" },
    @{File = "M95-SECURITY-COMPLIANCE.md"; Name = "Security & Compliance"; Priority = "🚨 CRITICAL"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "3 days"; Status = "🔄 HYBRID - Enhance M85-SECURITY-COMPLIANCE" },
    @{File = "M96-BACKUP-RECOVERY.md"; Name = "Backup & Recovery"; Priority = "🚨 CRITICAL"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M82-BACKUP-RECOVERY" },
    @{File = "M97-DATA-ARCHIVING-RETENTION.md"; Name = "Data Archiving & Retention"; Priority = "🔶 MEDIUM"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "3 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M98-PERFORMANCE-MONITORING.md"; Name = "Performance Monitoring"; Priority = "🔥 HIGH"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "3 days"; Status = "🔄 HYBRID - Enhance M39-ANALYTICS-BI" },
    @{File = "M99-LOG-MANAGEMENT.md"; Name = "Log Management"; Priority = "🔶 MEDIUM"; Phase = "Phase 17 - Infrastructure Modernization"; Effort = "2 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M100-API-RATE-LIMITING.md"; Name = "API Rate Limiting"; Priority = "🔥 HIGH"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M40-API-GATEWAY" },
    @{File = "M101-CIRCUIT-BREAKER.md"; Name = "Circuit Breaker"; Priority = "🔥 HIGH"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M40-API-GATEWAY" },
    @{File = "M102-SERVICE-DISCOVERY.md"; Name = "Service Discovery"; Priority = "🔥 HIGH"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M40-API-GATEWAY" },
    @{File = "M103-LOAD-BALANCING.md"; Name = "Load Balancing"; Priority = "🔥 HIGH"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M40-API-GATEWAY" },
    @{File = "M104-MESSAGE-QUEUE.md"; Name = "Message Queue"; Priority = "🔶 MEDIUM"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "3 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M105-CONTAINER-ORCHESTRATION.md"; Name = "Container Orchestration"; Priority = "🔶 MEDIUM"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "4 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M106-CICD-PIPELINE.md"; Name = "CI/CD Pipeline"; Priority = "🔥 HIGH"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "3 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M107-INFRASTRUCTURE-AS-CODE.md"; Name = "Infrastructure as Code"; Priority = "🔶 MEDIUM"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "3 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M108-CONFIGURATION-MANAGEMENT.md"; Name = "Configuration Management"; Priority = "🔶 MEDIUM"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "2 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M109-SECRET-MANAGEMENT.md"; Name = "Secret Management"; Priority = "🔥 HIGH"; Phase = "Phase 18 - Infrastructure Modernization"; Effort = "2 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M110-SERVICE-MESH.md"; Name = "Service Mesh"; Priority = "🔶 MEDIUM"; Phase = "Phase 19 - Infrastructure Modernization"; Effort = "3 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M111-API-GATEWAY-MANAGEMENT.md"; Name = "API Gateway Management"; Priority = "🔥 HIGH"; Phase = "Phase 19 - Infrastructure Modernization"; Effort = "2 days"; Status = "🔄 HYBRID - Enhance M40-API-GATEWAY" },
    @{File = "M112-MICROSERVICES-ARCHITECTURE.md"; Name = "Microservices Architecture"; Priority = "🔶 MEDIUM"; Phase = "Phase 19 - Infrastructure Modernization"; Effort = "4 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M113-EVENT-DRIVEN-ARCHITECTURE.md"; Name = "Event-Driven Architecture"; Priority = "🔶 MEDIUM"; Phase = "Phase 19 - Infrastructure Modernization"; Effort = "3 days"; Status = "❌ NO - CREATE NEW Module" },
    @{File = "M114-OBSERVABILITY.md"; Name = "Observability"; Priority = "🔥 HIGH"; Phase = "Phase 19 - Infrastructure Modernization"; Effort = "3 days"; Status = "🔄 HYBRID - Enhance M39-ANALYTICS-BI" }
)

foreach ($module in $modules) {
    $filePath = "ui-runbook/$($module.File)"
    $content = Get-Content $filePath -Raw
    
    # Extract module ID from filename
    $moduleId = $module.File -replace '\.md$', ''
    
    # Create new header
    $newHeader = @"
# 🎯 $moduleId`: $($module.Name) - UI Implementation Runbook

**Module ID**: $moduleId  
**Module Name**: $($module.Name)  
**Priority**: $($module.Priority)  
**Phase**: $($module.Phase)  
**Estimated Effort**: $($module.Effort)  
**Last Updated**: 2025-10-06

**Status**: $($module.Status)

---

## 📋 Module Overview
"@
    
    # Replace the template header section
    $pattern = '(?s)# 🎯 UI Runbook Template.*?## 📋 Module Overview'
    $newContent = $content -replace $pattern, $newHeader
    
    # Write back to file
    Set-Content -Path $filePath -Value $newContent -NoNewline
    Write-Host "Fixed template header in $($module.File)"
}
