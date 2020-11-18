clean:
	@echo "Cleaning project..."
	@py3clean .

test:
	@echo "Testing..."
	@python -m pytest test.py


format:
	@echo "Formatting..."
	@yapf --in-place --recursive --style="{indent_width: 4}" src/*.py
	@echo "Adding Version numbers..."
	@./version_add.sh
	@echo "Done!"

lint:
	@echo "Running linter..."
