from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from os import path
from flask_login import LoginManager

db = SQLAlchemy()
DB_NAME = "database.db"


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'flask_app_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    from . import views
    from .auth import auth
    from .models import User

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')

    create_database(app)

    # sub function
    @login_manager.user_loader
    def load_user(_id):
        return User.query.get(int(_id))
    
    return app


def create_database(app):
    if not path.exists('website/' + DB_NAME):
        with app.app_context():
            db.create_all()
            print("created database")
    elif app.debug:  # Auto-update in development
        inspector = db.inspect(db.engine)
        for table in db.Model.metadata.tables:
            if not inspector.has_table(table):
                db.create_all()
                break
            for col in db.Model.metadata.tables[table].columns:
                if col.name not in [c['name'] for c in inspector.get_columns(table)]:
                    db.engine.execute(f'ALTER TABLE {table} ADD COLUMN {col.name} {col.type}')