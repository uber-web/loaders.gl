// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// import {TILE3D_REFINEMENT, TILE3D_OPTIMIZATION_HINT} from '../constants';
// import ManagedArray from '../utils/managed-array';
// import assert from '../utils/assert';

export default class Tileset3DTraverser {
  /*
  constructor() {
    this.traversal = {
      stack: new ManagedArray(),
      stackMaximumLength: 0
    };

    this.emptyTraversal = {
      stack: new ManagedArray(),
      stackMaximumLength: 0
    };

    this.descendantTraversal = {
      stack: new ManagedArray(),
      stackMaximumLength: 0
    };

    this.selectionTraversal = {
      stack: new ManagedArray(),
      stackMaximumLength: 0,
      ancestorStack: new ManagedArray(),
      ancestorStackMaximumLength: 0
    };

    this.descendantSelectionDepth = 2;
  }

  isVisible(tile) {
    return tile._visible && tile._inRequestVolume;
  }

  selectTiles(frameState) {
    this._requestedTiles.length = 0;

    this._selectedTiles.length = 0;
    this._selectedTilesToStyle.length = 0;
    this._emptyTiles.length = 0;
    this._hasMixedContent = false;

    const root = this.root;
    this.updateTile(root, frameState);

    // The root tile is not visible
    if (!this.isVisible(root)) {
      return false;
    }

    // The this doesn't meet the SSE requirement, therefore the tree does not need to be rendered
    if (root.getScreenSpaceError(frameState, true) <= this._maximumScreenSpaceError) {
      return false;
    }

    if (!this.skipLevelOfDetail()) {
      this.executeBaseTraversal(root, frameState);
    } else if (this.immediatelyLoadDesiredLevelOfDetail) {
      this.executeSkipTraversal(root, frameState);
    } else {
      this.executeBaseAndSkipTraversal(root, frameState);
    }

    this.traversal.stack.trim(this.traversal.stackMaximumLength);
    this.emptyTraversal.stack.trim(this.emptyTraversal.stackMaximumLength);
    this.descendantTraversal.stack.trim(this.descendantTraversal.stackMaximumLength);
    this.selectionTraversal.stack.trim(this.selectionTraversal.stackMaximumLength);
    this.selectionTraversal.ancestorStack.trim(this.selectionTraversal.ancestorStackMaximumLength);

    return true;
  }

  executeBaseTraversal(root, frameState) {
    const baseScreenSpaceError = this._maximumScreenSpaceError;
    const maximumScreenSpaceError = this._maximumScreenSpaceError;
    this.executeTraversal(this, root, baseScreenSpaceError, maximumScreenSpaceError, frameState);
  }

  executeSkipTraversal(root, frameState) {
    const baseScreenSpaceError = Number.MAX_VALUE;
    const maximumScreenSpaceError = this._maximumScreenSpaceError;
    this.executeTraversal(this, root, baseScreenSpaceError, maximumScreenSpaceError, frameState);
    this.traverseAndSelect(this, root, frameState);
  }

  executeBaseAndSkipTraversal(root, frameState) {
    const baseScreenSpaceError = Math.max(this.baseScreenSpaceError, this.maximumScreenSpaceError);
    const maximumScreenSpaceError = this.maximumScreenSpaceError;
    this.executeTraversal(root, baseScreenSpaceError, maximumScreenSpaceError, frameState);
    this.traverseAndSelect(root, frameState);
  }

  skipLevelOfDetail() {
    return this._skipLevelOfDetail;
  }

  addEmptyTile(tile) {
    this._emptyTiles.push(tile);
  }

  selectTile(tile, frameState) {
    if (tile.contentVisibility(frameState) !== Intersect.OUTSIDE) {
      if (tile.content.featurePropertiesDirty) {
        // A feature's property in this tile changed, the tile needs to be re-styled.
        tile.content.featurePropertiesDirty = false;
        tile.lastStyleTime = 0; // Force applying the style to this tile
        this._selectedTilesToStyle.push(tile);
      } else if (tile._selectedFrame < frameState.frameNumber - 1) {
        // Tile is newly selected; it is selected this frame, but was not selected last frame.
        this._selectedTilesToStyle.push(tile);
      }
      tile._selectedFrame = frameState.frameNumber;
      this._selectedTiles.push(tile);
    }
  }

  selectDescendants(root, frameState) {
    const stack = descendantTraversal.stack;
    stack.push(root);
    while (stack.length > 0) {
      descendantTraversal.stackMaximumLength = Math.max(
        descendantTraversal.stackMaximumLength,
        stack.length
      );
      const tile = stack.pop();
      for (const child of this.children) {
        if (this.isVisible(child)) {
          if (child.contentAvailable) {
            this.updateTile(child, frameState);
            this.touchTile(child, frameState);
            this.selectTile(child, frameState);
          } else if (child._depth - root._depth < descendantSelectionDepth) {
            // Continue traversing, but not too far
            stack.push(child);
          }
        }
      }
    }
  }

  selectDesiredTile(tile, frameState) {
    if (!this.skipLevelOfDetail()) {
      if (tile.contentAvailable) {
        // The tile can be selected right away and does not require traverseAndSelect
        this.selectTile(tile, frameState);
      }
      return;
    }

    // If this tile is not loaded attempt to select its ancestor instead
    const loadedTile = tile.contentAvailable ? tile : tile._ancestorWithContentAvailable;
    if (loadedTile) {
      // Tiles will actually be selected in traverseAndSelect
      loadedTile._shouldSelect = true;
    } else {
      // If no ancestors are ready traverse down and select tiles to minimize empty regions.
      // This happens often for immediatelyLoadDesiredLevelOfDetail where parent tiles
      // are not necessarily loaded before zooming out.
      this.selectDescendants(tile, frameState);
    }
  }

  visitTile(tile, frameState) {
    ++this._statistics.visited;
    tile._visitedFrame = frameState.frameNumber;
  }

  touchTile(tile, frameState) {
    if (tile._touchedFrame === frameState.frameNumber) {
      // Prevents another pass from touching the frame again
      return;
    }
    this._cache.touch(tile);
    tile._touchedFrame = frameState.frameNumber;
  }

  // If skipLevelOfDetail is off try to load child tiles as soon as possible so that their parent can refine sooner.
  // Additive tiles are prioritized by distance because it subjectively looks better.
  // Replacement tiles are prioritized by screen space error.
  // A tileset that has both additive and replacement tiles may not prioritize tiles as effectively since SSE and distance
  // are different types of values. Maybe all priorities need to be normalized to 0-1 range.
  getPriority(tile) {
    switch (tile.refine) {
      case TILE3D_REFINEMENT.ADD:
        return tile._distanceToCamera;

      case TILE3D_REFINEMENT.REPLACE:
        const {parent} = tile;
        const useParentScreenSpaceError =
          parent &&
          (!this.skipLevelOfDetail() || tile._screenSpaceError === 0.0 || parent.hasTilesetContent);
        const screenSpaceError = useParentScreenSpaceError
          ? parent._screenSpaceError
          : tile._screenSpaceError;
        const rootScreenSpaceError = this.root._screenSpaceError;
        return rootScreenSpaceError - screenSpaceError; // Map higher SSE to lower values (e.g. root tile is highest priority)

      default:
        return assert(false);
    }
  }

  loadTile(tile, frameState) {
    if (this.hasUnloadedContent(tile) || tile.contentExpired) {
      tile._requestedFrame = frameState.frameNumber;
      tile._priority = this.getPriority(this, tile);
      this._requestedTiles.push(tile);
    }
  }

  updateVisibility(tile, frameState) {
    if (tile._updatedVisibilityFrame === this._updatedVisibilityFrame) {
      // Return early if visibility has already been checked during the traversal.
      // The visibility may have already been checked if the cullWithChildrenBounds optimization is used.
      return;
    }

    tile.updateVisibility(frameState);
    tile._updatedVisibilityFrame = this._updatedVisibilityFrame;
  }

  anyChildrenVisible(tile, frameState) {
    let anyVisible = false;
    for (const child of this.children) {
      this.updateVisibility(child, frameState);
      anyVisible = anyVisible || this.isVisible(child);
    }
    return anyVisible;
  }

  meetsScreenSpaceErrorEarly(tile, frameState) {
    const {parent} = tile;
    if (!parent || parent.hasTilesetContent || parent.refine !== TILE3D_REFINEMENT.ADD) {
      return false;
    }

    // Use parent's geometric error with child's box to see if the tile already meet the SSE
    return tile.getScreenSpaceError(frameState, true) <= this._maximumScreenSpaceError;
  }

  updateTileVisibility(tile, frameState) {
    this.updateVisibility(tile, frameState);

    if (!this.isVisible(tile)) {
      return;
    }

    const hasChildren = tile.children.length > 0;
    if (tile.hasTilesetContent && hasChildren) {
      // Use the root tile's visibility instead of this tile's visibility.
      // The root tile may be culled by the children bounds optimization in which
      // case this tile should also be culled.
      const firstChild = tile.children[0];
      this.updateTileVisibility(firstChild, frameState);
      tile._visible = firstChild._visible;
      return;
    }

    if (this.meetsScreenSpaceErrorEarly(tile, frameState)) {
      tile._visible = false;
      return;
    }

    // Optimization - if none of the tile's children are visible then this tile isn't visible
    const replace = tile.refine === TILE3D_REFINEMENT.REPLACE;
    const useOptimization =
      tile._optimChildrenWithinParent === TILE3D_OPTIMIZATION_HINT.USE_OPTIMIZATION;
    if (replace && useOptimization && hasChildren) {
      if (!this.anyChildrenVisible(tile, frameState)) {
        ++this._statistics.numberOfTilesCulledWithChildrenUnion;
        tile._visible = false;
        return;
      }
    }
  }

  updateTile(tile, frameState) {
    this.updateTileVisibility(tile, frameState);
    tile.updateExpiration();

    tile._shouldSelect = false;
    tile._finalResolution = true;
    tile._ancestorWithContent = undefined;
    tile._ancestorWithContentAvailable = undefined;

    const {parent} = tile;
    if (parent) {
      // ancestorWithContent is an ancestor that has content or has the potential to have
      // content. Used in conjunction with this.skipLevels to know when to skip a tile.
      // ancestorWithContentAvailable is an ancestor that is rendered if a desired tile is not loaded.
      const hasContent =
        this.hasUnloadedContent(parent) || parent._requestedFrame === frameState.frameNumber;
      tile._ancestorWithContent = hasContent ? parent : parent._ancestorWithContent;
      tile._ancestorWithContentAvailable = parent.contentAvailable
        ? parent
        : parent._ancestorWithContentAvailable;
    }
  }

  // Move to tile?
  hasEmptyContent(tile) {
    return tile.hasEmptyContent || tile.hasTilesetContent;
  }

  hasUnloadedContent(tile) {
    return !this.hasEmptyContent(tile) && tile.contentUnloaded;
  }

  reachedSkippingThreshold(tile) {
    const ancestor = tile._ancestorWithContent;
    return (
      !this.immediatelyLoadDesiredLevelOfDetail &&
      ancestor &&
      tile._screenSpaceError < ancestor._screenSpaceError / this.skipScreenSpaceErrorFactor &&
      tile._depth > ancestor._depth + this.skipLevels
    );
  }

  // eslint-disable-next-line complexity
  updateAndPushChildren(tile, stack, frameState) {
    const replace = tile.refine === TILE3D_REFINEMENT.REPLACE;

    for (const child of this.children) {
      this.updateTile(child, frameState);
    }

    function compareDistanceToCamera(a, b) {
      // Sort by farthest child first since this is going on a stack
      return b._distanceToCamera === 0 && a._distanceToCamera === 0
        ? b._centerZDepth - a._centerZDepth
        : b._distanceToCamera - a._distanceToCamera;
    }

    // Sort by distance to take advantage of early Z and reduce artifacts for skipLevelOfDetail
    this.children.sort(compareDistanceToCamera);

    // For traditional replacement refinement only refine if all children are loaded.
    // Empty tiles are exempt since it looks better if children stream in as they are loaded to fill the empty space.
    const checkRefines = !this.skipLevelOfDetail() && replace && !this.hasEmptyContent(tile);
    let refines = true;

    let anyChildrenVisible = false;
    for (const child of this.children) {
      if (this.isVisible(child)) {
        stack.push(child);
        anyChildrenVisible = true;
      } else if (checkRefines || this.loadSiblings) {
        // Keep non-visible children loaded since they are still needed before the parent can refine.
        // Or loadSiblings is true so always load tiles regardless of visibility.
        this.loadTile(child, frameState);
        this.touchTile(child, frameState);
      }
      if (checkRefines) {
        let childRefines;
        if (!child._inRequestVolume) {
          childRefines = false;
        } else if (this.hasEmptyContent(child)) {
          childRefines = this.executeEmptyTraversal(child, frameState);
        } else {
          childRefines = child.contentAvailable;
        }
        refines = refines && childRefines;
      }
    }

    if (!anyChildrenVisible) {
      refines = false;
    }

    return refines;
  }

  inBaseTraversal(tile, baseScreenSpaceError) {
    if (!this.skipLevelOfDetail()) {
      return true;
    }
    if (this.immediatelyLoadDesiredLevelOfDetail) {
      return false;
    }
    if (!tile._ancestorWithContent) {
      // Include root or near-root tiles in the base traversal so there is something to select up to
      return true;
    }
    if (tile._screenSpaceError === 0.0) {
      // If a leaf, use parent's SSE
      return tile.parent._screenSpaceError > baseScreenSpaceError;
    }
    return tile._screenSpaceError > baseScreenSpaceError;
  }

  canTraverse(tile) {
    if (tile.children.length === 0) {
      return false;
    }
    if (tile.hasTilesetContent) {
      // Traverse external this to visit its root tile
      // Don't traverse if the subtree is expired because it will be destroyed
      return !tile.contentExpired;
    }
    return tile._screenSpaceError > this._maximumScreenSpaceError;
  }

  // Depth-first traversal that traverses all visible tiles and marks tiles for selection.
  // If skipLevelOfDetail is off then a tile does not refine until all children are loaded.
  // This is the traditional replacement refinement approach and is called the base traversal.
  // Tiles that have a greater screen space error than the base screen space error are part of the base traversal,
  // all other tiles are part of the skip traversal. The skip traversal allows for skipping levels of the tree
  // and rendering children and parent tiles simultaneously.

  // eslint-disable-next-line max-statements, complexity
  executeTraversal(root, baseScreenSpaceError, maximumScreenSpaceError, frameState) {
    const {stack} = traversal;
    stack.push(root);

    while (stack.length > 0) {
      traversal.stackMaximumLength = Math.max(traversal.stackMaximumLength, stack.length);

      const tile = stack.pop();
      const baseTraversal = this.inBaseTraversal(tile, baseScreenSpaceError);
      const add = tile.refine === TILE3D_REFINEMENT.ADD;
      const replace = tile.refine === TILE3D_REFINEMENT.REPLACE;
      const parent = tile.parent;
      const parentRefines = !defined(parent) || parent._refines;
      let refines = false;

      if (this.canTraverse(tile)) {
        refines = this.updateAndPushChildren(tile, stack, frameState) && parentRefines;
      }

      const stoppedRefining = !refines && parentRefines;

      if (this.hasEmptyContent(tile)) {
        // Add empty tile just to show its debug bounding volume
        // If the tile has this content load the external this
        // If the tile cannot refine further select its nearest loaded ancestor
        this.addEmptyTile(tile, frameState);
        this.loadTile(tile, frameState);
        if (stoppedRefining) {
          this.selectDesiredTile(tile, frameState);
        }
      } else if (add) {
        // Additive tiles are always loaded and selected
        this.selectDesiredTile(tile, frameState);
        this.loadTile(tile, frameState);
      } else if (replace) {
        if (baseTraversal) {
          // Always load tiles in the base traversal
          // Select tiles that can't refine further
          this.loadTile(tile, frameState);
          if (stoppedRefining) {
            this.selectDesiredTile(tile, frameState);
          }
        } else if (stoppedRefining) {
          // In skip traversal, load and select tiles that can't refine further
          this.selectDesiredTile(tile, frameState);
          this.loadTile(tile, frameState);
        } else if (this.reachedSkippingThreshold(tile)) {
          // In skip traversal, load tiles that aren't skipped. In practice roughly half the tiles stay unloaded.
          this.loadTile(tile, frameState);
        }
      }

      this.visitTile(tile, frameState);
      this.touchTile(tile, frameState);
      tile._refines = refines;
    }
  }

  // Depth-first traversal that checks if all nearest descendants with content are loaded. Ignores visibility.
  executeEmptyTraversal(root, frameState) {
    const allDescendantsLoaded = true;
    const stack = emptyTraversal.stack;
    stack.push(root);

    while (stack.length > 0) {
      emptyTraversal.stackMaximumLength = Math.max(emptyTraversal.stackMaximumLength, stack.length);

      const tile = stack.pop();
      const children = tile.children;
      const childrenLength = children.length;

      // Only traverse if the tile is empty - traversal stop at descendants with content
      const traverse = hasEmptyContent(tile) && this.canTraverse(tile);

      // Traversal stops but the tile does not have content yet.
      // There will be holes if the parent tries to refine to its children, so don't refine.
      if (!traverse && !tile.contentAvailable) {
        allDescendantsLoaded = false;
      }

      this.updateTile(tile, frameState);
      if (!this.isVisible(tile)) {
        // Load tiles that aren't visible since they are still needed for the parent to refine
        this.loadTile(tile, frameState);
        this.touchTile(tile, frameState);
      }

      if (traverse) {
        for (const child of this.children) {
          stack.push(child);
        }
      }
    }

    return allDescendantsLoaded;
  }

  // Traverse the tree and check if their selected frame is the current frame. If so, add it to a selection queue.
  // This is a preorder traversal so children tiles are selected before ancestor tiles.
  //
  // The reason for the preorder traversal is so that tiles can easily be marked with their
  // selection depth. A tile's _selectionDepth is its depth in the tree where all non-selected tiles are removed.
  // This property is important for use in the stencil test because we want to render deeper tiles on top of their
  // ancestors. If a this is very deep, the depth is unlikely to fit into the stencil buffer.
  //
  // We want to select children before their ancestors because there is no guarantee on the relationship between
  // the children's z-depth and the ancestor's z-depth. We cannot rely on Z because we want the child to appear on top
  // of ancestor regardless of true depth. The stencil tests used require children to be drawn first.
  //
  // NOTE: 3D Tiles uses 3 bits from the stencil buffer meaning this will not work when there is a chain of
  // selected tiles that is deeper than 7. This is not very likely.

  // eslint-disable-next-line max-statements, complexity
  traverseAndSelect(root, frameState) {
    var stack = selectionTraversal.stack;
    var ancestorStack = selectionTraversal.ancestorStack;
    var lastAncestor;

    stack.push(root);

    while (stack.length > 0 || ancestorStack.length > 0) {
      selectionTraversal.stackMaximumLength = Math.max(
        selectionTraversal.stackMaximumLength,
        stack.length
      );
      selectionTraversal.ancestorStackMaximumLength = Math.max(
        selectionTraversal.ancestorStackMaximumLength,
        ancestorStack.length
      );

      if (ancestorStack.length > 0) {
        var waitingTile = ancestorStack.peek();
        if (waitingTile._stackLength === stack.length) {
          ancestorStack.pop();
          if (waitingTile !== lastAncestor) {
            waitingTile._finalResolution = false;
          }
          this.selectTile(waitingTile, frameState);
          continue;
        }
      }

      var tile = stack.pop();
      if (!defined(tile)) {
        // stack is empty but ancestorStack isn't
        continue;
      }

      var add = tile.refine === Cesium3DTileRefine.ADD;
      var shouldSelect = tile._shouldSelect;
      var children = tile.children;
      var childrenLength = children.length;
      var traverse = canTraverse(this, tile);

      if (shouldSelect) {
        if (add) {
          this.selectTile(tile, frameState);
        } else {
          tile._selectionDepth = ancestorStack.length;
          if (tile._selectionDepth > 0) {
            this._hasMixedContent = true;
          }
          lastAncestor = tile;
          if (!traverse) {
            this.selectTile(tile, frameState);
            continue;
          }
          ancestorStack.push(tile);
          tile._stackLength = stack.length;
        }
      }

      if (traverse) {
        for (var i = 0; i < childrenLength; ++i) {
          var child = children[i];
          if (isVisible(child)) {
            stack.push(child);
          }
        }
      }
    }
  }
  */
}
