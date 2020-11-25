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


lint:
	@echo "Running linter..."
	@pylint src/*.py --disable R0201,R0903


pre-commit:
	@make test
	@make format
	@make lint
	@make clean
