# Shape Create Tool Specification

## Overview
A standalone shape creation application that allows users to design custom pins and shapes for the Investigative Board. Created shapes are saved to localStorage and can be loaded into the main board as reusable pins.

## Core Requirements

### Storage & Persistence
- **Local Storage**: All created shapes saved to browser localStorage
- **User Account**: Future integration with user accounts for cloud storage
- **Data Structure**: Shapes stored as vector-based JSON with metadata
- **Load Integration**: Seamless import into main board as pin types

### Complexity Level
- **Basic Complexity**: Focused on essential shape creation without advanced features
- **Vector-Based**: All shapes stored as scalable vector graphics
- **Grid-Based**: 64x64 pixel grid system for precise creation

## Layer System

### Layer Architecture
1. **Base Layer** - Foundation shape/background
2. **Area Layer** - Main shape area definition
3. **Shadow Layer** - Drop shadows and depth effects
4. **Shaper Layer** - Complex shape layer with 3 sub-layers:
   - Shaper 1: Primary shape modifications
   - Shaper 2: Secondary effects (complex shadows)
   - Shaper 3: Tertiary effects (animations, special effects)
5. **Highlight Layer** - Highlights and glows
6. **Text Object/Layer** - Separate text elements (labels, annotations)

### Layer Properties (All Layers)
- **Fill Color**: Solid colors with alpha transparency
- **Stroke Color**: Outline colors with width control
- **Shape**: Vector path definitions
- **Gradient**: Linear/radial gradients
- **Label Position**: Text placement coordinates
- **Text Color**: Text fill color
- **Text Modifiers**: Bold, italic, underline

### Special Features
- **Image Attachment**: Upload/attach images to any layer
- **Effects**: Glowing, gradients, basic animations
- **Flow Animation**: Visual flow effects along connection lines (future enhancement)
- **SVG Import**: Import existing SVG shapes into layers

## Drawing Tools

### Grid System
- **64x64 Grid**: Precise pixel-based creation
- **Snap-to-Grid**: All drawing operations align to grid
- **Visual Grid**: Toggle-able grid overlay for alignment

### Drawing Tools
1. **Line Tool**: Draw straight lines that snap to grid points
2. **Curve Tool**: Bezier curves connecting grid points (e.g., x,y → x+1,y+4)
3. **Circle Tool**: Create circles snapped to center points or grid intersections
4. **Shape Primitives**: Basic shapes (rectangle, triangle, polygon)
5. **Selection Tool**: Select and modify existing elements
6. **Eraser Tool**: Remove grid blocks or shapes

### Tool Modifiers
- **Snap Settings**: Grid snap, center snap, axis alignment
- **Precision Mode**: Sub-pixel adjustments when needed
- **Layer Targeting**: Tools apply to currently selected layer

## User Interface

### Application Structure
- **Standalone HTML Page**: Separate from main board application
- **Canvas Area**: 64x64 grid workspace
- **Layer Panel**: Visual layer stack with properties
- **Tool Panel**: Drawing tools and modifiers
- **Shape Library**: Saved shapes with thumbnails
- **Properties Panel**: Layer and shape attributes

### File Menu (Shape Creator Only)
- **New Shape**: Start fresh shape project
- **Open Shape**: Load from localStorage
- **Save Shape**: Save current shape
- **Export Shape**: Export as SVG or custom format
- **Import SVG**: Import external SVG files
- **Delete Shape**: Remove from library

## Shape Library

### Organization
- **Grid View**: Thumbnail previews of saved shapes
- **Categories**: User-defined folders/groups
- **Search**: Filter by name or tags
- **Core Shapes**: Pre-loaded basic shapes (circle, square, star, etc.)

### Shape Metadata
- **Name**: User-defined shape name
- **Tags**: Categorization and search
- **Thumbnail**: Auto-generated preview image
- **Last Modified**: Timestamp
- **Usage Count**: Track frequency of use

## Technical Implementation

### Data Format
```json
{
  "id": "shape_123",
  "name": "Custom Icon",
  "layers": [
    {
      "type": "base",
      "shape": "path_data",
      "fillColor": "#FF0000",
      "strokeColor": "#000000",
      "properties": {...}
    }
  ],
  "dimensions": { "width": 64, "height": 64 },
  "thumbnail": "base64_image",
  "metadata": {...}
}
```

### Integration Points
- **Main Board Import**: Shapes load as new pin types
- **LocalStorage API**: Dedicated storage namespace
- **Export Formats**: SVG, PNG (rasterized), custom JSON
- **Version Control**: Shape versioning for updates

## Future Enhancements

### Advanced Features (Phase 2)
- **Animation System**: Keyframe-based shape animations
- **Flow Effects**: Connection line animations
- **Boolean Operations**: Shape combining/subtracting
- **Pattern Library**: Reusable shape components
- **Collaboration**: Share shapes between users

### Performance Optimizations
- **Shape Caching**: Pre-rendered thumbnails
- **Lazy Loading**: Load shapes on demand
- **Compression**: Efficient storage of vector data

## Success Metrics

### User Experience
- **Creation Time**: Average <5 minutes for basic shapes
- **Learning Curve**: Intuitive for non-designers
- **Integration**: Seamless import to main board
- **Performance**: Smooth operation on typical devices

### Technical Quality
- **Data Integrity**: Reliable save/load operations
- **Vector Accuracy**: Pixel-perfect rendering
- **Browser Compatibility**: Works across modern browsers
- **Storage Limits**: Efficient use of localStorage

## Implementation Phases

### Phase 1: Core Functionality
- Basic layer system (5 layers + text)
- Grid-based drawing tools
- Local storage save/load
- Simple shape library
- SVG import/export

### Phase 2: Enhanced Features
- Advanced effects and animations
- Image attachments
- Expanded toolset
- Cloud synchronization

### Phase 3: Ecosystem
- Shape marketplace
- Collaboration features
- Advanced export options
- Mobile support
