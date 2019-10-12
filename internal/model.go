package internal

import (
	"context"
	"crypto/sha512"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/xerrors"
)

type listing struct {
	Name        string
	Description string
	Text        string
	Author      string
	Loc         int
	IsPublic    bool
}

func filter(query string) bson.D {
	return bson.D{
		{"name", bson.D{{"$regex", query}, {"$options", "i"}}},
		{"author", bson.D{{"$regex", query}, {"$options", "i"}}},
		{"description", bson.D{{"$regex", query}, {"$options", "i"}}},
	}
}

func (a *app) listListing(query string) ([]listing, error) {
	var listings []listing
	wrapErr := "app.listListing fails: %w"

	cur, err := a.db.Collection("listings").Find(context.Background(), filter(query))
	if err != nil {
		return listings, xerrors.Errorf(wrapErr, err)
	}
	for cur.Next(context.Background()) {
		var elem listing
		if err := cur.Decode(&elem); err != nil {
			return nil, xerrors.Errorf(wrapErr, err)
		}
		listings = append(listings, elem)
	}

	if err := cur.Err(); err != nil {
		return nil, xerrors.Errorf(wrapErr, err)
	}
	if err := cur.Close(context.Background()); err != nil {
		return nil, xerrors.Errorf(wrapErr, err)
	}

	return listings, nil
}

// todo: don't use "primitive.ObjectID" like "ID" of entities

type user struct {
	ID       primitive.ObjectID `bson:"_id"`
	Login    string
	Password []byte
}

// Sessions must be with ttl
type session struct {
	ID        primitive.ObjectID `bson:"_id"`
	UserID    primitive.ObjectID
	CreatedAt time.Time
}

func (a *app) calculateHash(d []byte) []byte {
	s := sha512.New()
	s.Write(d)
	s.Write([]byte(a.cfg.salt))
	return s.Sum(nil)
}

func (a *app) createUser(login, password string) (user, error) {
	cln := a.db.Collection("users")

	u := user{
		ID:       primitive.NewObjectID(),
		Login:    login,
		Password: a.calculateHash([]byte("password")),
	}

	_, err := cln.InsertOne(context.TODO(), u)
	if err != nil {
		return u, err
	}
	return u, nil
}

func (a *app) Authenticate(login, password string) (user, error) {
	cln := a.db.Collection("users")

	var u user
	return u, cln.FindOne(context.TODO(), bson.D{{"login", login}, {"password", a.calculateHash([]byte(password))}}).Decode(&u)
}

func (a *app) createSession(u user) (string, error) {
	cln := a.db.Collection("sessions")

	s := session{
		ID:        primitive.NewObjectID(),
		UserID:    u.ID,
		CreatedAt: time.Now(),
	}

	_, err := cln.InsertOne(context.TODO(), s)
	if err != nil {
		return "", err
	}

	return s.ID.Hex(), nil
}

func (a *app) deleteSession(token string) {

}
