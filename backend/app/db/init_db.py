from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.train_route import TrainRoute  # Import to ensure table creation
from app.db.base_class import Base
from app.db.session import engine


def init_db(db: Session) -> None:
    """
    Initialize the database with default data.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Check if admin user already exists
    admin_user = db.query(User).filter(User.username == "admin").first()

    if not admin_user:
        # Create default admin user
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("admin"),
            full_name="Administrator",
            is_active=True,
            is_superuser=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("✅ Default admin user created successfully!")
        print("   Username: admin")
        print("   Password: admin")
    else:
        print("ℹ️  Admin user already exists in database")


if __name__ == "__main__":
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
