# Data Import & Board Creation Specification

## Overview
A comprehensive data import system that transforms various structured data formats into fully-featured Investigative Board layouts. Supports industry-standard formats plus a proprietary JSON schema for maximum flexibility and feature support.

## Core Requirements

### Supported Input Formats

#### 1. Mermaid Diagrams (Primary)
- **Mermaid Flowchart**: Decision trees, framework explainers, SOPs
- **Mermaid Diagram**: Power dynamics maps, historical context, business model teardown
- **Mermaid Mind Map**: Mind map supplements and brainstorming
- **Mermaid Chart**: Event timelines, channel timelines

#### 2. Business Model Canvas
- Visual business model diagrams
- Structured canvas layouts with 9 key components

#### 3. Network Diagram
- Power dynamics relationships
- Node-link relationship visualizations

#### 4. Timeline Map
- Chronological event mapping
- Timeline-based data visualization

#### 5. Proprietary JSON Schema
- Full support for all board features
- Custom pin types, connections, shapes
- Advanced styling and metadata
- Extensible for future features

### Proprietary JSON Schema

#### Core Structure
```json
{
  "version": "1.0",
  "metadata": {
    "title": "Board Title",
    "description": "Board description",
    "author": "Creator name",
    "created": "2024-01-01T00:00:00Z",
    "layout": "hierarchical",
    "theme": "default"
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "pin",
      "pinType": "circle",
      "position": { "x": 100, "y": 200 },
      "content": {
        "label": "Node Label",
        "note": "Detailed notes",
        "color": "#58a6ff",
        "size": 1.0
      },
      "metadata": {
        "tags": ["tag1", "tag2"],
        "priority": "high",
        "status": "active"
      }
    }
  ],
  "connections": [
    {
      "id": "conn_1",
      "from": "node_1",
      "to": "node_2",
      "type": "solid",
      "color": "#666",
      "label": "Relationship"
    }
  ],
  "groups": [
    {
      "id": "group_1",
      "nodes": ["node_1", "node_2"],
      "label": "Group Name",
      "color": "#f0f0f0"
    }
  ]
}
```

#### Schema Features
- **Version Control**: Schema versioning for compatibility
- **Rich Metadata**: Title, description, author, timestamps
- **Layout Specification**: Predefined layout algorithms
- **Node Types**: Full pin type support with custom properties
- **Connection Types**: Various line styles and relationships
- **Grouping**: Node collections and visual organization
- **Extensibility**: Custom properties and future features

## Layout Algorithms

### Available Layouts
1. **Hierarchical**: Tree-like parent-child relationships
2. **Directional**: Left-to-right or top-to-bottom flow
3. **Grid**: Structured grid-based positioning
4. **Flow**: Organic flow-based arrangement
5. **Circular/Radial**: Center-out radial layout
6. **Organizational**: Org chart style layouts
7. **Split/Quadrant**: Four-quadrant divided layouts

### Layout Selection Logic
- **Schema-Driven**: `layout` parameter in metadata determines algorithm
- **Fallback Logic**: Automatic layout detection based on data structure
- **User Override**: Manual layout selection during import

## Node Mapping System

### Intelligent Mapping
- **Content Analysis**: Automatic detection of node types from content
- **Structure Recognition**: Parent-child relationships from indentation/hierarchy
- **Type Inference**: Smart detection of pin types based on content patterns
- **Metadata Extraction**: Tags, priorities, and custom properties

### Mapping Rules
1. **Headers → Main Pins**: H1/H2 become primary nodes
2. **Lists → Child Pins**: Nested lists create hierarchical relationships
3. **Bold Text → Key Pins**: Important content gets emphasized styling
4. **Links → Connections**: References create relationship lines
5. **Metadata → Properties**: Extract tags, dates, priorities

### Post-Import Mapping Tool
- **Visual Interface**: Drag-drop mapping of imported pins to custom types
- **Bulk Operations**: Apply mappings to multiple pins at once
- **Preview Mode**: See how mappings will affect the board
- **Save Templates**: Reusable mapping configurations

## Import Process

### Data Validation
- **Syntax Checking**: Valid JSON/Mermaid structure
- **Schema Validation**: Required fields and data types
- **Relationship Integrity**: Valid node references in connections
- **Content Sanitization**: Safe text and metadata handling

### Import Options
- **Replace Board**: Complete replacement of current content
- **Add to Location**:
  - Top: Add above existing content
  - Right: Add to the right of existing content
  - Left: Add to the left of existing content
  - Bottom: Add below existing content

### Error Handling
- **Validation Reports**: Detailed error messages with line numbers
- **Partial Import**: Import valid portions with warnings
- **Recovery Suggestions**: Automated fixes for common issues
- **Rollback Capability**: Undo failed imports

## Board Management System

### Board Collection
- **Local Storage**: Browser-based board persistence
- **Metadata Tracking**: Title, description, creation date, tags
- **Thumbnail Generation**: Auto-generated board previews
- **Version History**: Track changes and revisions

### Board Operations
- **Save Board**: Save current state to collection
- **Load Board**: Replace current board with saved version
- **Delete Board**: Remove from collection
- **Clear Board**: Reset to empty state
- **Merge Boards**: Combine multiple boards with positioning options

### Board Library
- **Search & Filter**: Find boards by name, tags, date
- **Categories**: Organize boards into folders/projects
- **Sharing**: Export/import board collections
- **Backup**: Automatic local backups

## Advanced Features

### Relationship Intelligence
- **Parent-Child Detection**: Automatic hierarchy creation
- **Cross-Reference Resolution**: Link related content across the board
- **Dependency Mapping**: Show relationships and dependencies
- **Custom Relationships**: User-defined connection types

### Data Enhancement
- **Content Enrichment**: Add metadata and properties during import
- **Image Integration**: Attach images referenced in source data
- **Link Preservation**: Maintain external links and references
- **Formatting Retention**: Preserve text styling and structure

### Export Capabilities
- **JSON Schema**: Export boards in proprietary format
- **Standard Formats**: Export to Mermaid, Markdown, CSV
- **Image Export**: PNG/SVG rasterization options
- **Documentation**: Generate reports and summaries

## Implementation Architecture

### Parser Modules
- **Mermaid Parser**: Convert Mermaid syntax to board structure
- **Markdown Parser**: Transform markdown hierarchies to board layouts
- **JSON Validator**: Schema validation and data integrity checks
- **Layout Engine**: Position calculation and optimization

### Integration Points
- **Main Board**: Seamless import into existing canvas
- **Shape Library**: Access to custom pin shapes
- **Theme System**: Apply themes during import
- **Validation Engine**: Real-time feedback and error checking

## Success Metrics

### User Experience
- **Import Speed**: Sub-second processing for typical documents
- **Accuracy**: 95%+ correct structure recognition
- **Flexibility**: Support for diverse input formats
- **Intuitive Mapping**: Easy customization of imported content

### Technical Quality
- **Data Integrity**: Zero data loss during import/export
- **Performance**: Smooth operation with large datasets
- **Compatibility**: Works across all supported input formats
- **Extensibility**: Easy addition of new formats and layouts

## Implementation Phases

### Phase 1: Core Import (Current)
- Mermaid flowchart, diagram, mindmap support
- Basic markdown list processing
- Proprietary JSON schema
- Hierarchical layout algorithm
- Board save/load system

### Phase 2: Enhanced Features
- Business Model Canvas support
- Network diagram visualization
- Timeline mapping
- Advanced layout algorithms
- Cross-reference resolution

### Phase 3: Ecosystem Integration
- Third-party format support
- Collaboration features
- Advanced export options
- API integration capabilities

## Future Considerations

### AI Enhancement
- **Smart Layout**: AI-powered optimal positioning
- **Content Analysis**: Automatic categorization and tagging
- **Relationship Detection**: AI-identified connections and dependencies

### Advanced Visualizations
- **Interactive Timelines**: Dynamic timeline exploration
- **3D Layouts**: Three-dimensional board representations
- **Animation Support**: Transition animations between layouts

### Enterprise Features
- **Team Collaboration**: Multi-user board editing
- **Version Control**: Git-like branching and merging
- **Audit Trails**: Track changes and user actions
- **Compliance**: Data governance and security features
