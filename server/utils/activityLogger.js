// server/utils/activityLogger.js

/**
 * Creates an activity log entry in the database
 * 
 * @param {Object} client - PostgreSQL client (from pool.connect())
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.boardId - ID of the related board
 * @param {string} [params.cardId] - ID of the related card (if applicable)
 * @param {string} [params.listId] - ID of the related list (if applicable)
 * @param {string} params.actionType - Type of action (e.g., 'create_card', 'move_card')
 * @param {string} params.entityType - Type of entity affected ('board', 'list', 'card', etc.)
 * @param {string} params.entityId - ID of the entity affected
 * @param {Object} [params.details] - Additional details about the action (JSON)
 * @returns {Object} The created activity log entry
 */
async function createActivityLog(client, params) {
    const {
      userId,
      boardId,
      cardId = null,
      listId = null,
      actionType,
      entityType,
      entityId,
      details = {}
    } = params;
    
    try {
      const result = await client.query(
        `INSERT INTO activities
         (user_id, board_id, card_id, list_id, action_type, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, boardId, cardId, listId, actionType, entityType, entityId, details]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }
  
  /**
   * Gets recent activity for a board
   * 
   * @param {Object} db - PostgreSQL pool
   * @param {string} boardId - ID of the board
   * @param {number} [limit=20] - Maximum number of activities to return
   * @returns {Array} Array of activity objects
   */
  async function getBoardActivity(db, boardId, limit = 20) {
    try {
      const result = await db.query(
        `SELECT a.*, u.username, u.avatar_url
         FROM activities a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.board_id = $1
         ORDER BY a.created_at DESC
         LIMIT $2`,
        [boardId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching board activity:', error);
      throw error;
    }
  }
  
  /**
   * Gets recent activity for a specific card
   * 
   * @param {Object} db - PostgreSQL pool
   * @param {string} cardId - ID of the card
   * @param {number} [limit=10] - Maximum number of activities to return
   * @returns {Array} Array of activity objects
   */
  async function getCardActivity(db, cardId, limit = 10) {
    try {
      const result = await db.query(
        `SELECT a.*, u.username, u.avatar_url
         FROM activities a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.card_id = $1
         ORDER BY a.created_at DESC
         LIMIT $2`,
        [cardId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching card activity:', error);
      throw error;
    }
  }
  
  /**
   * Gets recent activity for a user across all boards
   * 
   * @param {Object} db - PostgreSQL pool
   * @param {string} userId - ID of the user
   * @param {number} [limit=20] - Maximum number of activities to return
   * @returns {Array} Array of activity objects
   */
  async function getUserActivity(db, userId, limit = 20) {
    try {
      const result = await db.query(
        `SELECT a.*, b.title as board_title, u.username, u.avatar_url
         FROM activities a
         JOIN boards b ON a.board_id = b.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  }
  
  /**
   * Formats an activity entry for display
   * 
   * @param {Object} activity - Activity object from database
   * @returns {Object} Formatted activity object with readable message
   */
  function formatActivity(activity) {
    // Base formatted activity
    const formatted = {
      id: activity.id,
      timestamp: activity.created_at,
      user: {
        id: activity.user_id,
        username: activity.username || 'Unknown User',
        avatar_url: activity.avatar_url
      },
      action: activity.action_type,
      entityType: activity.entity_type,
      details: activity.details || {}
    };
    
    // Create a readable message based on action type
    let message = '';
    
    switch (activity.action_type) {
      case 'create_board':
        message = `${formatted.user.username} created this board`;
        break;
      case 'create_list':
        message = `${formatted.user.username} created list "${activity.details.title}"`;
        break;
      case 'create_card':
        message = `${formatted.user.username} created card "${activity.details.title}"`;
        break;
      case 'move_card':
        message = `${formatted.user.username} moved card "${activity.details.cardTitle}" from "${activity.details.sourceListTitle}" to "${activity.details.targetListTitle}"`;
        break;
      case 'update_card':
        const changes = [];
        if (activity.details.titleChanged) changes.push('title');
        if (activity.details.descriptionChanged) changes.push('description');
        if (activity.details.dueDateChanged) changes.push('due date');
        if (activity.details.labelsChanged) changes.push('labels');
        message = `${formatted.user.username} updated ${changes.join(', ')} on card "${activity.details.cardTitle}"`;
        break;
      case 'add_member_to_card':
        message = `${formatted.user.username} assigned ${activity.details.targetUsername} to card "${activity.details.cardTitle}"`;
        break;
      case 'remove_member_from_card':
        message = `${formatted.user.username} removed ${activity.details.targetUsername} from card "${activity.details.cardTitle}"`;
        break;
      case 'comment_on_card':
        message = `${formatted.user.username} commented on card "${activity.details.cardTitle}"`;
        break;
      default:
        message = `${formatted.user.username} performed an action`;
    }
    
    formatted.message = message;
    return formatted;
  }
  
  module.exports = {
    createActivityLog,
    getBoardActivity,
    getCardActivity,
    getUserActivity,
    formatActivity
  };