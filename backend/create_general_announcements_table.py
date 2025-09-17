#!/usr/bin/env python3
"""
Script to create the general_announcements table in the database.
Run this script to add the new table to your existing database.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base_class import Base
from app.models.general_announcement import GeneralAnnouncement
from app.models.user import User


def create_general_announcements_table():
    """
    Create the general_announcements table in the database.
    """
    try:
        print("🔄 Creating general_announcements table...")
        
        # Create the table
        GeneralAnnouncement.__table__.create(bind=engine, checkfirst=True)
        
        print("✅ general_announcements table created successfully!")
        print("📋 Table structure:")
        print("   - id (Primary Key)")
        print("   - title (String, Indexed)")
        print("   - category (String, Indexed)")
        print("   - english_content (Text)")
        print("   - hindi_content (Text, Optional)")
        print("   - marathi_content (Text, Optional)")
        print("   - gujarati_content (Text, Optional)")
        print("   - ai_model_type (String, Default: 'male')")
        print("   - isl_video_path (String, Optional)")
        print("   - audio_path (String, Optional)")
        print("   - is_translated (Boolean, Default: False)")
        print("   - is_active (Boolean, Default: True)")
        print("   - created_by (Foreign Key to users.id)")
        print("   - created_at (DateTime)")
        print("   - updated_at (DateTime)")
        print("")
        print("🔗 Relationships:")
        print("   - creator: Relationship with User model")
        print("")
        print("📊 Constraints:")
        print("   - ai_model_type must be 'male' or 'female'")
        print("   - category must be one of the predefined categories")
        print("   - Search indexes on title, category, created_by, and is_active")
        
    except Exception as e:
        print(f"❌ Error creating table: {str(e)}")
        return False
    
    return True


def verify_table_creation():
    """
    Verify that the table was created successfully.
    """
    try:
        db = SessionLocal()
        
        # Check if table exists by querying it
        result = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='general_announcements'")
        table_exists = result.fetchone() is not None
        
        if table_exists:
            print("✅ Verification successful: general_announcements table exists in database")
        else:
            print("❌ Verification failed: general_announcements table not found")
            return False
            
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error verifying table: {str(e)}")
        return False


if __name__ == "__main__":
    print("🚀 General Announcements Table Creation Script")
    print("=" * 50)
    
    # Create the table
    if create_general_announcements_table():
        # Verify creation
        if verify_table_creation():
            print("\n🎉 Table creation completed successfully!")
            print("💡 You can now use the GeneralAnnouncement model in your application.")
        else:
            print("\n⚠️  Table creation may have failed. Please check the database.")
    else:
        print("\n❌ Table creation failed. Please check the error messages above.")