#!/usr/bin/env python3
"""Make a Katalyzr tester login.

Usage:  python3 katalyzr/tools/add-tester.py "Full Name" [username] [code]

Prints a fresh password (give it to the tester) and the line to paste into
katalyzr/accounts.js. Only a salted SHA-256 hash of the password goes into the
site, so the password itself never appears in the repo.
"""
import hashlib
import re
import secrets
import sys

WORDS = ["amber", "brass", "cedar", "comet", "coral", "delta", "ember", "fable", "harbor", "indigo",
         "juniper", "lumen", "maple", "meadow", "nova", "orbit", "prism", "quartz", "river", "sable",
         "summit", "tidal", "velvet", "willow"]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    name = sys.argv[1].strip()
    username = sys.argv[2] if len(sys.argv) > 2 else re.sub(r"[^a-z.]", "", name.lower().replace(" ", "."))
    code = sys.argv[3] if len(sys.argv) > 3 else "KTZ-0" + str(secrets.randbelow(900) + 100)
    password = "-".join(secrets.choice(WORDS).capitalize() for _ in range(2)) + "-" + str(secrets.randbelow(90) + 10)
    salt = secrets.token_hex(8)
    digest = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
    print(f"Username: {username}\nPassword: {password}\n")
    print(f'    {{ username: "{username}", name: "{name}", code: "{code}", salt: "{salt}", hash: "{digest}" }},')


if __name__ == "__main__":
    main()
