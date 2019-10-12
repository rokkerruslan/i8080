package internal

import (
	"encoding/json"
	"net/http"

	"golang.org/x/xerrors"
)

// todo: add more powerful criteria search

func (a *app) APIError(w http.ResponseWriter, error string, code int) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)

	a.log.Println(xerrors.Errorf("api error: %w", error))

	// todo: not need to error checking?
	if err := json.NewEncoder(w).Encode(struct {
		Error string
	}{Error: error}); err != nil {
		a.log.Println(xerrors.Errorf("encode err fail: %w", err))
	}
}

// exampleList return source listings available for all people
func (a *app) exampleList(w http.ResponseWriter, r *http.Request) {
	examples, err := a.listListing(r.URL.Query().Get("query"))
	if err != nil {
		a.APIError(w,  err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(examples); err != nil {
		a.APIError(w, err.Error(), http.StatusInternalServerError)
	}
}

func (a *app) collectionsList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		return
	}

	examples, err := a.listListing(r.URL.Query().Get("criteria"))
	if err != nil {
		a.APIError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(examples); err != nil {
		a.APIError(w, err.Error(), http.StatusInternalServerError)
	}
}

func (a *app) singIn(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	enc := json.NewDecoder(r.Body)

	var c credentials
	if err := enc.Decode(&c); err != nil {
		a.APIError(w,  err.Error(), http.StatusBadRequest)
		return
	}
	if err := r.Body.Close(); err != nil {
		a.APIError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if c.Login == "" {
		a.APIError(w,  "login required", http.StatusBadRequest)
		return
	}
	if c.Password == "" {
		a.APIError(w,  "password required", http.StatusBadRequest)
		return
	}

	u, err := a.Authenticate(c.Login, c.Password)
	if err != nil {
		a.APIError(w,  xerrors.Errorf("auth failed: %s", err).Error(), http.StatusForbidden)
		return
	}

	session, err := a.createSession(u)

	t := token{Token: session}

	if err := json.NewEncoder(w).Encode(t); err != nil {
		a.APIError(w, err.Error(), http.StatusInternalServerError)
	}
}

func (a *app) signOut(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		return
	}

	a.deleteSession(r.Header.Get("x-auth-token"))
}

type credentials struct {
	Login    string
	Password string
}

type token struct {
	Token string
}

func (a *app) signUp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "not allowed", http.StatusMethodNotAllowed)
		return
	}

	enc := json.NewDecoder(r.Body)

	var c credentials
	if err := enc.Decode(&c); err != nil {
		a.APIError(w,  err.Error(), http.StatusBadRequest)
	}
	if err := r.Body.Close(); err != nil {
		a.log.Println(err)
		return
	}

	if c.Login == "" {
		a.APIError(w,  "login required", http.StatusBadRequest)
		return
	}
	if c.Password == "" {
		a.APIError(w,  "password required", http.StatusBadRequest)
		return
	}

	u, err := a.createUser(c.Login, c.Password)
	if err != nil {
		a.APIError(w,  err.Error(), http.StatusInternalServerError)
		return
	}

	var t token
	t.Token, err = a.createSession(u)
	if err != nil {
		a.APIError(w,  xerrors.New("session failed").Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(t); err != nil {
		a.APIError(w,  err.Error(), http.StatusInternalServerError)
		return
	}
}

func (a *app) infoHandler (w http.ResponseWriter, r *http.Request) {
	if err := json.NewEncoder(w).Encode(a.info); err != nil {
		a.APIError(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
