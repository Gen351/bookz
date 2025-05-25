// js/app.js
document.addEventListener('DOMContentLoaded', async () => {
    const userEmailElem = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');
    const addBookForm = document.getElementById('add-book-form');
    const bookListElem = document.getElementById('book-list');
    const loadingMessageElem = document.getElementById('loading-message');
    const noBooksMessageElem = document.getElementById('no-books-message');
    const formErrorMessageElem = document.getElementById('form-error-message');
    const bookIdInput = document.getElementById('book-id');
    const saveBookButton = document.getElementById('save-book-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');

    let currentUser = null;

    // Check if supabase client is loaded
    if (!window.supabase) {
        console.error('Supabase client not loaded. Make sure supabaseClient.js is included before app.js and configured correctly.');
        if (loadingMessageElem) loadingMessageElem.textContent = 'Error: Supabase client not loaded. Cannot fetch books.';
        if (formErrorMessageElem) formErrorMessageElem.textContent = 'Error: Supabase client not loaded.';
        return;
    }

    // Authentication check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    } else {
        currentUser = session.user; // This should set currentUser]
        if (userEmailElem) userEmailElem.textContent = currentUser.email;

        // ─── Ensure profile exists ──────────────────────────────────────────────
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (profileErr) {
            console.error('Error checking profile:', profileErr);
        } else if (!profile) {
            // No profile row yet → create one using email as fallback username
            const { error: insertErr } = await supabase
            .from('profiles')
            .insert({
                user_id:    currentUser.id,
                email:      currentUser.email,
                username:   currentUser.email
            });
            if (insertErr) console.error('Error creating profile:', insertErr);
        }
        // ───────────────────────────────────────────────────────────────────────
        await loadBooks();
    }

    // Handle logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Logout error:', error.message);
                alert(`Logout failed: ${error.message}`);
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // Handle Add/Edit Book Form
    if (addBookForm) {
        addBookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formErrorMessageElem.textContent = '';

            const bookName = document.getElementById('book-name').value.trim();
            const bookAuthor = document.getElementById('book-author').value.trim();
            const readCount = parseInt(document.getElementById('read-count').value) || 0;
            const comment = document.getElementById('comment').value.trim();
            const bookId = bookIdInput.value;

            console.log("Current User for saving book:", currentUser); // ADD THIS LINE
            if (currentUser) {
                console.log("Current User ID:", currentUser.id); // ADD THIS LINE
            } else {
                console.error("currentUser is null, cannot save book with user_id!");
                formErrorMessageElem.textContent = 'Error: User session not found. Please log in again.';
                return; // Stop execution if no current user
            }

            if (!currentUser.id) {
                console.error("currentUser.id is missing!");
                formErrorMessageElem.textContent = 'Error: User ID is missing. Please log in again.';
                return; // Stop execution if no user ID
            }

            const bookData = {
                book_name: bookName,
                book_author: bookAuthor,
                read_count: readCount,
                comment: comment,
                user_id: currentUser.id
            };

            try {
                let response;
                if (bookId) { // Editing existing book
                    const { data, error } = await supabase
                        .from('books')
                        .update(bookData)
                        .eq('id', bookId)
                        .eq('user_id', currentUser.id) // Ensure user can only update their own books (RLS also enforces this)
                        .select();
                    response = { data, error };
                } else { // Adding new book
                    const { data, error } = await supabase
                        .from('books')
                        .insert(bookData)
                        .select();
                    response = { data, error };
                }

                if (response.error) throw response.error;

                addBookForm.reset();
                bookIdInput.value = ''; // Clear hidden ID
                saveBookButton.textContent = 'Add Book';
                if(cancelEditButton) cancelEditButton.style.display = 'none';
                await loadBooks(); // Refresh the list

            } catch (error) {
                console.error('Error saving book:', error.message);
                formErrorMessageElem.textContent = `Error saving book: ${error.message}`;
            }
        });
    }
    
    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', () => {
            addBookForm.reset();
            bookIdInput.value = '';
            saveBookButton.textContent = 'Add Book';
            cancelEditButton.style.display = 'none';
            formErrorMessageElem.textContent = '';
        });
    }


// In the loadBooks function, update the book card creation logic
    // Function to load books
    async function loadBooks() {
        if (!bookListElem || !loadingMessageElem || !noBooksMessageElem) return;

        bookListElem.innerHTML = ''; // Clear current list
        loadingMessageElem.style.display = 'block';
        noBooksMessageElem.style.display = 'none';

        try {
            const { data: books, error } = await supabase
                .from('books')
                .select('*')
                .eq('user_id', currentUser.id);

            if (error) throw error;

            loadingMessageElem.style.display = 'none';
            if (books && books.length > 0) {
                books.forEach(book => {
                    const bookCard = createBookCard(book);
                    bookListElem.appendChild(bookCard);

                    // Hide details initially
                    const author = bookCard.querySelector('.author');
                    const readCount = bookCard.querySelector('.read-count');
                    const commentLabel = bookCard.querySelector('.comment-label');
                    const comment = bookCard.querySelector('.comment');
                    const editBtn = bookCard.querySelector('.btn.btn-secondary');
                    const deleteBtn = bookCard.querySelector('.btn.btn-danger');

                    author.hidden = true;
                    readCount.hidden = true;
                    commentLabel.hidden = true;
                    comment.hidden = true;
                    editBtn.hidden = true;
                    deleteBtn.hidden = true;

                    // Show details on click
                    bookCard.addEventListener('click', () => {
                        // Toggle the visibility of the details
                        const isDetailsVisible = !author.hidden;
                    
                        author.hidden = isDetailsVisible;
                        readCount.hidden = isDetailsVisible;
                        commentLabel.hidden = isDetailsVisible;
                        comment.hidden = isDetailsVisible;
                        editBtn.hidden = isDetailsVisible;
                        deleteBtn.hidden = isDetailsVisible;
                    });
                });
            } else {
                noBooksMessageElem.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading books:', error.message);
            loadingMessageElem.textContent = `Failed to load books: ${error.message}`;
        }
    }
    
    // Function to load books
    async function loadBooks() {
        if (!bookListElem || !loadingMessageElem || !noBooksMessageElem) return;
    
        bookListElem.innerHTML = ''; // Clear current list
        loadingMessageElem.style.display = 'block';
        noBooksMessageElem.style.display = 'none';
    
        try {
            const { data: books, error } = await supabase
                .from('books')
                .select('*')
                .eq('user_id', currentUser.id);
    
            if (error) throw error;
    
            loadingMessageElem.style.display = 'none';
            if (books && books.length > 0) {
                books.forEach(book => {
                    const bookCard = createBookCard(book);
                    bookListElem.appendChild(bookCard);
    
                    // Hide details initially
                    const author = bookCard.querySelector('.author');
                    const readCount = bookCard.querySelector('.read-count');
                    const commentLabel = bookCard.querySelector('.comment-label'); // Fixed here
                    const comment = bookCard.querySelector('.comment');
                    const editBtn = bookCard.querySelector('.btn.btn-secondary');
                    const deleteBtn = bookCard.querySelector('.btn.btn-danger');
    
                    author.hidden = true;
                    readCount.hidden = true;
                    commentLabel.hidden = true; // Hides the note label
                    comment.hidden = true;
                    editBtn.hidden = true;
                    deleteBtn.hidden = true;
    
                    // Show details on click
                    bookCard.addEventListener('click', () => {
                        // Toggle the visibility of the details
                        const isDetailsVisible = !author.hidden;
    
                        author.hidden = isDetailsVisible;
                        readCount.hidden = isDetailsVisible;
                        commentLabel.hidden = isDetailsVisible;
                        comment.hidden = isDetailsVisible;
                        editBtn.hidden = isDetailsVisible;
                        deleteBtn.hidden = isDetailsVisible;
                    });
                });
            } else {
                noBooksMessageElem.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading books:', error.message);
            loadingMessageElem.textContent = `Failed to load books: ${error.message}`;
        }
    }

    // Function to create a book card element
    function createBookCard(book) {
        const card = document.createElement('div');
        card.classList.add('book-card');
        card.dataset.id = book.id;
    
        const title = document.createElement('h3');
        title.textContent = book.book_name;
    
        const author = document.createElement('p');
        author.classList.add('author');
        author.innerHTML = `<strong>Author:</strong> ${book.book_author}`;
    
        const readCount = document.createElement('p');
        readCount.classList.add('read-count');
        readCount.innerHTML = `<strong>Progress:</strong> ${book.read_count}`;
    
        // Create the "Note" label
        const noteLabel = document.createElement('label');
        noteLabel.innerHTML = `<strong>Note:</strong>`;
        noteLabel.classList.add('comment-label');
    
        // Create the comment container
        const commentWrapper = document.createElement('div');
        commentWrapper.classList.add('comment-wrapper');
    
        // Create the comment itself
        const comment = document.createElement('p');
        comment.classList.add('comment');
        comment.innerHTML = `${book.comment || '<em>No comments yet.</em>'}`;
        if (book.comment && book.comment.length > 100) {
            comment.innerHTML = `<strong>Notes:</strong> ${book.comment.substring(0, 100)}...`;
        }
    
        // Append label and comment to the wrapper
        commentWrapper.appendChild(noteLabel);
        commentWrapper.appendChild(comment);
    
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('book-actions');
    
        const editButton = document.createElement('button');
        editButton.classList.add('btn', 'btn-secondary');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => populateEditForm(book));
    
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('btn', 'btn-danger');
        deleteButton.style.backgroundColor = '#c0392b'; // Simple danger color
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteBook(book.id, book.book_name));
    
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
    
        card.appendChild(title);
        card.appendChild(author);
        card.appendChild(readCount);
        card.appendChild(commentWrapper); // Append the comment wrapper
        card.appendChild(actionsDiv);
    
        return card;
    }
    // Function to populate form for editing
    function populateEditForm(book) {
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-name').value = book.book_name;
        document.getElementById('book-author').value = book.book_author;
        document.getElementById('read-count').value = book.read_count;
        document.getElementById('comment').value = book.comment;

        saveBookButton.textContent = 'Update Book';
        if (cancelEditButton) cancelEditButton.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    }

    // Function to delete a book
    async function deleteBook(bookId, bookName) {
        if (!confirm(`Are you sure you want to delete "${bookName}"?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('books')
                .delete()
                .eq('id', bookId)
                .eq('user_id', currentUser.id); // RLS should also enforce this

            if (error) throw error;

            await loadBooks(); // Refresh list
        } catch (error) {
            console.error('Error deleting book:', error.message);
            alert(`Failed to delete book: ${error.message}`);
        }
    }
});
