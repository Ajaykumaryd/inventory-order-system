from sqlalchemy.orm import declarative_base

# Shared declarative base for every ORM model. Importing the individual model
# modules (see this package's __init__) registers them on this Base so that
# Base.metadata is complete for create_all() / migrations.
Base = declarative_base()
